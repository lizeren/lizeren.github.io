---
title: 'Relocation Tutorial 1'
date: 2025-02-02
permalink: /posts/2025/02/relocation1/
tags:
  - Articles
---

# Relocation of shared libraries

Recently I was drawn into linking and loading process of shared libraries.

This article from [Eli Bendersky](https://eli.thegreenplace.net/2011/08/25/load-time-relocation-of-shared-libraries/) gives a good handson explanation of the process. 

## Issue 1: Linking the shared library for load-time relocation

While I was trying to rerun the examples, I had some trouble with my modern machine. The original article is written in 2011,so the object file was compiled with elf32-i386. My machine is 64-bit, so instead of using the command given in the article, I have to use the following command to compile the object file.

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
- -fno-pie and -fno-plt disable position independence, but system¡¯s GCC/glibc included in driver.c expects shared objects to be position-independent.
- The printf function is a shared library symbol, and the GOT (Global Offset Table) must be accessed properly.

what we should do instead is:
```bash
gcc -m32 -fno-pie -c driver.c -o driver.o
gcc -m32 -fno-pie -o driver driver.o -L. -lmlreloc
```

