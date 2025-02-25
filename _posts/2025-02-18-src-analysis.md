---
title: 'Source Code Analysis'
date: 2025-02-18
permalink: /posts/2025/02/src-analysis/
tags:
  - Articles
---
## Workflow of analyzing source code

We will be using clang and llvm to analyze the source code.

It is ok that the source code that will be analyzed is not compiled. In the CMakeLists.txt, we need to add the following command: `set (CMAKE_EXPORT_COMPILE_COMMANDS ON)` as this command will generate a compile_commands.json file, which intercepts the compilation process and records the dependency of each source files.

## abc 

Lets take the abc project as an example. This is one of the output of the compile_commands.json file that compiles the source file cmdStarter.c to an object file.
```bash
/usr/bin/cc  -I/mnt/linuxstorage/vlsi-open-source-tool/abc/src -Wall -Wno-unused-function -Wno-write-strings -Wno-sign-compare -DLIN64 -DSIZEOF_VOID_P=8 -DSIZEOF_LONG=8 -DSIZEOF_INT=4 -DABC_USE_CUDD=1 -DABC_USE_READLINE -DABC_USE_PTHREADS -fno-exceptions -Wno-unused-but-set-variable -o CMakeFiles/libabc.dir/src/base/cmd/cmdStarter.c.o -c /mnt/linuxstorage/vlsi-open-source-tool/abc/src/base/cmd/cmdStarter.c
```
We need to extract the relevant options:

- Include Paths (-I)
```bash
-I/mnt/linuxstorage/vlsi-open-source-tool/abc/src
```
- Preprocessor Definitions (-D):
```bash
-DLIN64 -DSIZEOF_VOID_P=8 -DSIZEOF_LONG=8 -DSIZEOF_INT=4 -DABC_USE_CUDD=1 -DABC_USE_READLINE -DABC_USE_PTHREADS
```
- Warnings (-W): This is optional
```bash
-Wall -Wno-unused-function -Wno-write-strings -Wno-sign-compare -Wno-unused-but-set-variable
```
Now, use these flags when running MyStaticAnalyzer:
```bash
./MyStaticAnalyzer /mnt/linuxstorage/vlsi-open-source-tool/abc/src/base/cmd/cmdStarter.c -- \
  -I/mnt/linuxstorage/vlsi-open-source-tool/abc/src \
  -DLIN64 -DSIZEOF_VOID_P=8 -DSIZEOF_LONG=8 -DSIZEOF_INT=4 \
  -DABC_USE_CUDD=1 -DABC_USE_READLINE -DABC_USE_PTHREADS \
  -Wall -Wno-unused-function -Wno-write-strings -Wno-sign-compare -Wno-unused-but-set-variable
```
This ensures Clang has the same include paths and macros as your original compilation command.