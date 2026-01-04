---
title: 'GCC FunctionInstrumentation'
date: 2026-01-03
permalink: /posts/2026/01/GCC-Function-Instrumentation/
tags:
  - Articles
  - GCC
  - Function Instrumentation
---
In this post, we explore how the `-finstrument-functions` flag and a custom GCC plugin can be used to intercept function entry and exit at compile time. We then examine a less obvious case: what happens when the function we want to instrument is not defined in the main binary, but instead lives in a shared library.

# Motivation

In my research project, I built a shared library that exposes two public API functions: `pmc_measure_begin_csv()` and `pmc_measure_end()`. Conceptually, these functions delimit a measurement region. By executing a target function between these two calls, we can collect a wide range of hardware performance events such as cache hits and misses, branch prediction behavior, and TLB activity during the function’s execution.

The most straightforward way to use these APIs is to manually insert the measurement calls at the beginning and end of each target function. While simple, this approach does not scale: it requires modifying source code, is error-prone, and becomes impractical for large codebases or third-party libraries.

To avoid manual instrumentation, we would like an automated mechanism that triggers measurement when a specific function is entered and stops measurement when it exits. Rather than reasoning in terms of individual call instructions, a more natural abstraction is *function entry and exit*. If we can intercept these events, we can attach measurement logic without changing the function’s source code.

This is exactly what GCC’s `-finstrument-functions` flag provides.

# Instrumentation

The `-finstrument-functions` compiler flag is a feature provided by compilers such as GCC (and also supported by Intel C/C++/Fortran compilers) that enables automatic instrumentation of function entry and exit. When enabled, the compiler injects user-defined hooks at the beginning and end of functions, allowing external code to observe or augment function execution.


## How it works

When you compile code with the `-finstrument-functions` flag, the compiler automatically inserts instrumentation hooks at the entry and exit of every function in the translation unit, unless the function is explicitly excluded using attributes such as `__attribute__((no_instrument_function))`.

Concretely, the compiler injects calls to two user-defined functions:

void __cyg_profile_func_enter(void *this_fn, void *call_site);
void __cyg_profile_func_exit (void *this_fn, void *call_site);

It is the user’s responsibility to provide definitions for these functions and ensure they are correctly linked into the final program. In our case, `__cyg_profile_func_enter()` invokes `pmc_measure_begin_csv()`, and `__cyg_profile_func_exit()` invokes `pmc_measure_end()`. These two APIs symbolize the start and finish of a measurement region.

The parameters passed to the hooks provide contextual information:
- `this_fn` is the address of the function being entered or exited
- `call_site` is the address of the call instruction that invoked the function

This mechanism allows instrumentation code to identify which function is executing and where it was called from, without requiring any source-level modifications to the target function.

However, as you might expect, inserting hooks at the entry and exit of *every* function introduces significant runtime overhead. Although `-finstrument-functions` supports exclusion mechanisms, it is not practical to manually exclude the vast majority of functions in a nontrivial codebase.

To mitigate this overhead, we use a custom [GCC plugin](https://github.com/lizeren/instrument-attribute-gcc-plugin) that selectively instruments only a specified set of target functions, allowing us to retain the benefits of automatic instrumentation while keeping overhead manageable.



## Usage

To use `-finstrument-functions` together with the custom GCC plugin, both need to be added to the compiler flags. In this example, I use the `configure` script to build the wolfSSL project. I chose wolfSSL because it provides a comprehensive test suite, which would be tedious to instrument manually.

The most important part is the `CFLAGS` setting:
- `-finstrument-functions` enables function entry/exit instrumentation
- `-fplugin=$PWD/instrument_attribute.so` specifies the path to the custom GCC plugin
- `-fplugin-arg-instrument_attribute-include-function-list` defines a whitelist of functions to instrument

Only functions listed in this whitelist will be instrumented. In this case, I instrument only `wc_Sha256Update`, which is a public API function provided by wolfSSL.

To recap the overall setup:

- Definition of `wc_Sha256Update`: `libwolfssl.so`
- `__cyg_profile_func_enter`: implemented in `libpmc.so`, calls `pmc_measure_begin_csv`
- `__cyg_profile_func_exit`: implemented in `libpmc.so`, calls `pmc_measure_end`
- Actual call to `wc_Sha256Update`: `testsuite.test` (the main binary)

Since the implementations of `__cyg_profile_func_enter` and `__cyg_profile_func_exit` live in the shared library `libpmc.so`, we also link against `-lpmc` via `LIBS`.

```bash
./configure \
  CFLAGS="-finstrument-functions -Wno-error=maybe-uninitialized \
          -fplugin=$PWD/instrument_attribute.so \
          -fplugin-arg-instrument_attribute-include-function-list=wc_Sha256Update" \
  LDFLAGS="-rdynamic -Wl,--no-as-needed" \
  LIBS="-L$PWD/testsuite -lpmc -lpthread -ldl"
```

nNext, build the project:

```bash
make -j
export LD_LIBRARY_PATH="$PWD/testsuite:$LD_LIBRARY_PATH"  # tell the loader where libpmc.so is
```

Then invoke the wolfSSL test suite with `libpmc.so` preloaded:

```bash
# You can ignore PMC_EVENT_INDICES; it is specific to libpmc.so
export PMC_EVENT_INDICES="0,1,2,3"
LD_PRELOAD=$PWD/testsuite/libpmc.so ./testsuite/testsuite.test
```

At this point, a natural question arises:

> Haven’t we already specified the path to `libpmc.so` during configuration  
> (`LIBS="-L$PWD/testsuite -lpmc"`)?


If we omit `LD_PRELOAD` and inspect the runtime dependencies of the main binary, we see that `libpmc.so` is not listed:

```bash
$ readelf -d testsuite/.libs/testsuite.test | grep NEEDED
 0x0000000000000001 (NEEDED) Shared library: [libwolfssl.so.44]
 0x0000000000000001 (NEEDED) Shared library: [libc.so.6]
```
So who is responsible for loading `libpmc.so`?

Recall that `wc_Sha256Update` is defined in `libwolfssl.so`, not in the main binary `testsuite.test`. Therefore, any instrumentation inserted into `wc_Sha256Update` will reside in `libwolfssl.so`. Let’s inspect the dependencies of that shared library instead:

```bash
$ readelf -d src/.libs/libwolfssl.so | grep NEEDED
 0x0000000000000001 (NEEDED) Shared library: [libm.so.6]
 0x0000000000000001 (NEEDED) Shared library: [libpmc.so]
 0x0000000000000001 (NEEDED) Shared library: [libc.so.6]
```

This explains why `libpmc.so` is loaded at runtime: it is a dependency of `libwolfssl.so`, not of the main binary.

Why does this dependency exist? Going back to the behavior of `-finstrument-functions`, the compiler inserts calls to `__cyg_profile_func_enter` and `__cyg_profile_func_exit` at the entry and exit of `wc_Sha256Update`. Since these functions are defined in `libpmc.so`, the references inside `libwolfssl.so` are undefined and must be resolved at link or load time.

We can confirm this by inspecting the symbols:

```bash

$ nm -D testsuite/.libs/testsuite.test | grep -E 'wc_Sha256Update'
                 U wc_Sha256Update

$ nm -D src/.libs/libwolfssl.so | grep -E 'wc_Sha256Update'
0000000000018b00 T wc_Sha256Update

$ nm -D testsuite/libpmc.so | grep -E '__cyg_profile_func_(enter|exit)'
0000000000004bc0 T __cyg_profile_func_enter
0000000000005120 T __cyg_profile_func_exit

$ nm -D src/.libs/libwolfssl.so | grep -E '__cyg_profile_func_(enter|exit)'
                 U __cyg_profile_func_enter
                 U __cyg_profile_func_exit

$ nm -u testsuite/testsuite_test-testsuite.o | grep -E '__cyg_profile_func_(enter|exit)' || echo "no cyg_profile refs in this object"
no cyg_profile refs in this object

```

As expected:

-   `libwolfssl.so` defines `wc_Sha256Update` but has undefined references to the profiling hooks
    
-   `libpmc.so` defines the profiling hooks
    
-   the main binary does not directly reference the profiling hooks at all
    

To understand how these undefined references are resolved at runtime, we can inspect the dynamic loader’s debug output:

```bash
$ LD_DEBUG=bindings,libs ./testsuite/testsuite.test 2>&1 | grep -E '__cyg_profile_func_(enter|exit)|libpmc'
    544683:	find library=libpmc.so [0]; searching
    544683:	  trying file=/home/lizeren/Desktop/wolfssl/src/.libs/libpmc.so
    544683:	  trying file=/home/lizeren/Desktop/wolfssl/testsuite/libpmc.so
    544683:	binding file /home/lizeren/Desktop/wolfssl/testsuite/libpmc.so [0] to /lib/x86_64-linux-gnu/libc.so.6 [0]: normal symbol `__cxa_finalize' [GLIBC_2.2.5]
    544683:	binding file /home/lizeren/Desktop/wolfssl/testsuite/libpmc.so [0] to /home/lizeren/Desktop/wolfssl/testsuite/.libs/testsuite.test [0]: normal symbol `stderr' [GLIBC_2.2.5]
    544683:	calling init: /home/lizeren/Desktop/wolfssl/testsuite/libpmc.so
    544683:	binding file /home/lizeren/Desktop/wolfssl/src/.libs/libwolfssl.so.44 [0] to /lib/x86_64-linux-gnu/libc.so.6 [0]: normal symbol `__cyg_profile_func_enter'
    544683:	binding file /home/lizeren/Desktop/wolfssl/src/.libs/libwolfssl.so.44 [0] to /lib/x86_64-linux-gnu/libc.so.6 [0]: normal symbol `__cyg_profile_func_exit'
    544683:	calling fini: /home/lizeren/Desktop/wolfssl/testsuite/libpmc.so [0]
```

The instrumentation hooks are NOT coming from libpmc.

These two lines are the key:
```bash
binding file ... libwolfssl.so.44 ... to /lib/x86_64-linux-gnu/libc.so.6 ... symbol `__cyg_profile_func_enter'
binding file ... libwolfssl.so.44 ... to /lib/x86_64-linux-gnu/libc.so.6 ... symbol `__cyg_profile_func_exit'
```

This reveals the core issue: although `libpmc.so` is loaded, the instrumentation hooks used by `libwolfssl.so` are _not_ coming from `libpmc.so`.

Instead, at runtime, `libwolfssl.so` resolves `__cyg_profile_func_enter` and `__cyg_profile_func_exit` to `glibc`’s `libc.so.6`.

Why would `libc` provide these symbols?

On many systems, `libc` exports `__cyg_profile_func_enter` and `__cyg_profile_func_exit` (sometimes as real implementations, sometimes as weak or toolchain-related symbols). During dynamic linking, symbol resolution follows a global search order. Because `libc` is loaded early and provides versioned definitions of these symbols, it can “win” symbol resolution even when another shared library (such as `libpmc.so`) also defines them.

As a result, although `libpmc.so` is present in the process, it is not the provider of the instrumentation hooks actually used by `libwolfssl.so`.

### Why libc version wins?

Both `libc.so` and `libpmc.so` define `__cyg_profile_func_enter/exit`.

```bash
$ nm -D /lib/x86_64-linux-gnu/libc.so.6 | grep -E '__cyg_profile_func_(enter|exit)'
00000000001342e0 T __cyg_profile_func_enter@@GLIBC_2.2.5
00000000001342e0 T __cyg_profile_func_exit@@GLIBC_2.2.5
$ nm -D testsuite/libpmc.so | grep -E '__cyg_profile_func_(enter|exit)'
0000000000004bc0 T __cyg_profile_func_enter
0000000000005120 T __cyg_profile_func_exit
```
When libwolfssl.so has undefined references to these functions, the dynamic linker resolves them in a global search order and prefers matching symbol versions when available. Because libc provides the default version @@GLIBC_2.2.5 and is always in the global namespace early, the bindings go to libc (as your LD_DEBUG=bindings already showed).

So libpmc is loaded, but it’s not the provider of the hooks — libc is.


# Simpler cases

In the previous section, we examined a scenario where the target function is defined in a shared library, while the actual call site resides in the main binary. In that setup, the instrumentation hooks provided by another shared library were effectively bypassed due to dynamic symbol resolution.

We now consider a simpler and more conventional case: the target function is defined in the main binary, the function call also originates from the same binary, and the instrumentation hooks are provided by a shared library.

The setup in this case is as follows:

- Definition of `ecc_test_key_decode`: `testsuite.test` (shown with a lowercase `t` symbol by `nm`, indicating a local text symbol)
- `__cyg_profile_func_enter`: implemented in `libpmc.so`, calls `pmc_measure_begin_csv`
- `__cyg_profile_func_exit`: implemented in `libpmc.so`, calls `pmc_measure_end`
- Invocation of `ecc_test_key_decode`: `testsuite.test`

In this configuration, the main binary `testsuite.test` contains undefined references to `__cyg_profile_func_enter` and `__cyg_profile_func_exit`, and therefore explicitly depends on `libpmc.so`. Unlike `wc_Sha256Update`, which is defined in a shared library, `ecc_test_key_decode` is defined directly in the main executable.

Because both the function definition and its call site reside in the main binary, the profiling hooks are resolved at load time against `libpmc.so` as expected. There is no intermediate shared library introducing additional symbol resolution complexity, and the instrumentation behaves correctly.

```bash
$ nm -D testsuite/.libs/testsuite.test | grep -E '__cyg_profile_func_(enter|exit)'
                 U __cyg_profile_func_enter
                 U __cyg_profile_func_exit

$ readelf -d testsuite/.libs/testsuite.test | grep NEEDED
 0x0000000000000001 (NEEDED)             Shared library: [libwolfssl.so.44]
 0x0000000000000001 (NEEDED)             Shared library: [libpmc.so]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]

$ nm testsuite/.libs/testsuite.test | grep -E 'ecc_test_key_decode'
0000000000018b00 t ecc_test_key_decode
```



