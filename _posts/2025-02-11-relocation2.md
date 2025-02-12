---
title: 'Relocation Tutorial 2'
date: 2025-02-11
permalink: /posts/2025/02/relocation2/
tags:
  - Articles
---

This post is about PIC and GOT of shared libraries' global variables and functions.
Original post [here](https://eli.thegreenplace.net/2011/11/03/position-independent-code-pic-in-shared-libraries/)

If the website of the original article is down in the future, you can refer to the [PDF document](/../files/archive-copy/PIC_shared_libraries.pdf).
## How to verify that the run-time address of ml_util_func@plt

I follow the original post and below is the output on my own machine.
Note it is possible that register ebx is different on your machine. Verify by `__x86.get_pc_thunk.bx`
```bash
(gdb) set environment LD_LIBRARY_PATH=.
(gdb) set disassembly-flavor intel
(gdb) disas ml_func
Dump of assembler code for function ml_func:
   0xf7fba172 <+0>:	push   ebp
   0xf7fba173 <+1>:	mov    ebp,esp
   0xf7fba175 <+3>:	push   ebx
   0xf7fba176 <+4>:	sub    esp,0x14
   0xf7fba179 <+7>:	call   0xf7fba060 <__x86.get_pc_thunk.bx>
   0xf7fba17e <+12>:	add    ebx,0x2e82
=> 0xf7fba184 <+18>:	sub    esp,0xc
   0xf7fba187 <+21>:	push   DWORD PTR [ebp+0x8]

```


Now lets run the program and verify the address.

```bash
(gdb) set environment LD_LIBRARY_PATH=.
(gdb) break ml_func
Breakpoint 1 at 0x1050
(gdb) r
Starting program: /home/lizeren/Desktop/relo/func/driver 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".

Breakpoint 1, ml_func (a=1, b=1) at ml_main.c:10
10	    int c = b + ml_util_func(a);
(gdb) i registers ebx
ebx            0xf7fbd000          -134492160
(gdb) x/w 0xF7FBD00C
0xf7fbd00c <ml_util_func@got.plt>:	-134504378
(gdb) x 0xF7FBD00C
0xf7fbd00c <ml_util_func@got.plt>:	0xf7fba046
(gdb) x 0xF7FBD00b
0xf7fbd00b:	0xfba046f7
```
At this point, register ebx contains the instruction address of 
`0xf7fba17e <+12>:	add    ebx,0x2e82`, plus 0x2e82. so 0x2e82+0xf7fba17e = 0xF7FBD000. value at 0xF7FBD00C is 0xf7fba046.
use `info symbol` command to verify the address. it prints the name of a symbol which is stored at the address addr. If no symbol is stored exactly at addr, GDB prints the nearest symbol and an offset from it
```bash
(gdb) info symbol 0xf7fba046
ml_util_func@plt + 6 in section .plt of ./libmlpic.so
```
It is indeed pointing to the push instruction of ml_util_func@plt.
```bash
(gdb) x/20i 0xf7fba040
   0xf7fba040 <ml_util_func@plt>:	jmp    DWORD PTR [ebx+0xc]
   0xf7fba046 <ml_util_func@plt+6>:	push   0x0
   0xf7fba04b <ml_util_func@plt+11>:	jmp    0xf7fba030
```