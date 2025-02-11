---
title: 'Relocation Tutorial 1'
date: 2025-02-07
permalink: /posts/2025/02/relocation1/
tags:
  - Articles
---

# Relocation of shared libraries

Recently I was drawn into linking and loading process of shared libraries.

This article from [Eli Bendersky](https://eli.thegreenplace.net/2011/08/25/load-time-relocation-of-shared-libraries/) gives a good handson explanation of the process. 

## Issue 1: Linking the shared library for load-time relocation

While I was trying to rerun the examples, I had some trouble with my modern machine. The original article is written in 2011, so the object file was compiled with elf32-i386. My machine is 64-bit, so instead of using the command given in the article, I have to use the following command to compile the object file.

First downlaod 32-bit development tools
```bash
sudo apt install gcc-multilib libc6-dev-i386
```
Then compile the object file with 32-bit flag
```bash
gcc -m32 -g -fno-plt -fno-pie -c ml_main.c -o ml_mainreloc.o
gcc -m32 -g -shared -o libmlreloc.so ml_mainreloc.o
```
-fno-plt: Disables PLT stubs. Disables Procedure Linkage Table (PLT) optimizations, leading to direct memory accesses.
-fno-pie: Prevents position-independent executable (PIE) generation. Disables Position-Independent Executable (PIE), allowing absolute addresses.

Though you will still see the warning
```bash
usr/bin/ld: ml_mainreloc.o: warning: relocation against myglob' in read-only section .text'
/usr/bin/ld: warning: creating DT_TEXTREL in a shared object
```
The warnings indicate that load-time relocation is happening, and the shared library contains text relocations (DT_TEXTREL), which are undesirable in modern systems.
In the end, add this shared library to the PATH
```bash
export LD_LIBRARY_PATH=.:$LD_LIBRARY_PATH
```

## Issue 2: Load-time relocation in action

If we follow the same idea of the previous compilation, that is 
```bash
gcc -m32 -g -fno-plt -fno-pie -c driver.c -o driver.o
gcc -m32 -g -fno-pie -o driver driver.o -L. -lmlreloc
```
we will get the following error
```bash
/usr/bin/ld: driver.o: direct GOT relocation R_386_GOT32X against printf@@GLIBC_2.0' without base register can not be used when making a shared object
/usr/bin/ld: failed to set dynamic section sizes: Success
collect2: error: ld returned 1 exit status
```
This error occurs because:
- The R_386_GOT32X relocation is being used, but the code is compiled without  Procedure Linkage Table (PLT).
- -fno-pie and -fno-plt disable position independence, but systems GCC/glibc included in driver.c expects shared objects to be position-independent.
- The printf function is a shared library symbol, and the GOT (Global Offset Table) must be accessed properly.

what we should do instead is:
```bash
gcc -m32 -fno-pie -g -c driver.c -o driver.o
gcc -m32 -fno-pie -g -o driver driver.o -L. -lmlreloc
```

## Extra credit #2 explanation:
#### 1. Why Sym.Value Equals Offset in R_386_COPY Relocations?

The Sym.Value column represents the symbol's value, which is typically its resolved address.
The Sym.Value field in readelf -r represents the address where the symbol is expected to be found at runtime.
It corresponds to the st_value field in the ELF symbol table (.symtab).
For functions, Sym.Value is the address where the function starts in memory.
For global variables, Sym.Value is the address where the variable is stored in memory.
Example (for a function)
If ml_util_func is defined in a shared library:
```bash
000004b4  00000502 R_386_PC32        0000049c   ml_util_func
```
Sym.Value (0000049c) is the resolved address of ml_util_func.
The relocation at offset 000004b4 updates a PC-relative reference to this address. Which in other words, 4b4 is the instruction address where the function ml_util_func is called in the program.

#### 2. Special Case: R_386_COPY Relocation
When a global variable (like myglob) is defined in a shared library but referenced in an executable, an R_386_COPY relocation occurs. This changes the usual meaning of Sym.Value.

Example (readelf -r driver output)
```bash
0804a018  00000605 R_386_COPY        0804a018   myglob
```
For myglob, we see that:

Offset = 0x804a018 → The location in the executable where the copied data will reside.
Sym.Value = 0x804a018 → The value of myglob, but why is it the same?
Normally, Sym.Value points to the original definition of the symbol (inside libmlreloc.so).
However, for R_386_COPY, the dynamic linker overrides this:
It creates a new copy of myglob inside the executable.
The linker replaces Sym.Value with the new address in the executable.
This ensures that all references to myglob now use the program’s copy, not the shared library’s.
Thus, for R_386_COPY, Sym.Value reflects the newly allocated address inside the program rather than the original address in the shared library.

#### 3. What Happens at Runtime?
The dynamic loader (ld.so) processes relocation entries.
It sees an R_386_COPY relocation for myglob.
It copies the value of myglob from libmlreloc.so to the new location (0x804a018) in driver.
From this point onward, all references to myglob use the copy in driver.


If the website of the original article is down in the future, you can refer to the [PDF document](/../files/archive-copy/load-time-relocation.pdf).
