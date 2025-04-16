---
title: 'VLSIDesignChain: 1 - Synthesis by Yosys '
date: 2025-04-14
permalink: /posts/2025/04/vlsi-design-chain/
tags:
  - VLSI
  - Articles
---

## Synthesis by Yosys

This is the first post in the VLSIDesignChain series using free open source VLSI design tools as well as proprietary tools interleaved.

### FPGA
This step provides a good starting point for learning Yosys.
```bash
yosys yosys.v
```
Inside the interactive shell
```bash
synth_ice40 -top fifo
write_verilog -noattr gate_level.v
```
Note: synth_ice40 is a prepackaged synthesis script. Yosys official documentation provides a detailed walkthrough of of how the script is made and what each command in the script does.
Source: [Yosys Synthesis Starter](https://yosyshq.readthedocs.io/projects/yosys/en/stable/getting_started/example_synth.html#final-steps), [write_verilog](https://yosyshq.readthedocs.io/projects/yosys/en/latest/cmd/write_verilog.html#cmd-write_verilog)

### ASIC
Now we are ready to synthesize the ASIC design, which will be used in the next post for placement and routing.
We use [FreePDK45](https://mflowgen.readthedocs.io/en/latest/stdlib-freepdk45.html), a free PDK for research and academic purposes. You can find the liberty file [here](https://github.com/mflowgen/mflowgen/tree/master/adks/freepdk-45nm/pkgs/base).
#### Key Files in Your FreePDK-45nm Package
- `stdcells.lib`
Purpose: This is your Liberty file containing the standard cell library. It typically includes information such as cell area, (in a complete library, timing arcs, delays, setup/hold times, and other timing parameters—but in some cases, simplified versions may only define area and functionality).
- `stdcells.v`
Purpose: This file is a Verilog representation of the standard cells. It may define the behavioral models (or gate-level instantiation templates) for simulation purposes.
Usage in Yosys:
You might include this file in your synthesis flow as a reference model. In some flows, you read this file to provide technology-specific functionality (especially for simulation), but for pure synthesis and mapping, the Liberty file is what guides the mapping.
- `stdcells.lef` and `stdcells.gds`
Purpose:
The LEF file describes the physical dimensions, pin placements, and routing blockages of the standard cells, which is used in placement and routing (P&R) tools.
The GDS file contains the physical layout of the cells.
Usage in Yosys:
Yosys does not use LEF or GDS files during synthesis. These files become important later in the physical design flow (for placement, routing, parasitic extraction, etc.)—typically handled by P&R and layout tools.


Here we still using the previous verilog file `fifo.v`. 
Inside the interactive shell
```bash
read_verilog fifo.v
hierarchy -check -top fifo
proc; opt
memory; opt
fsm; opt
techmap; opt

dfflibmap -liberty 'path/to/freepdk45/stdcells.lib'
In my case
dfflibmap -liberty /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/stdcells.lib

# map the synthesized combinational logic to the cells defined in the Liberty file.
abc -liberty 'path/to/freepdk45/stdcells.lib' 
In my case
abc -liberty /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/stdcells.lib

clean
write_verilog -noattr fifo_asic_FreePDK45.v
```
#### Purpose of dfflibmap
- **Mapping Generic DFFs**:
By default, Yosys uses generic D flip-flop implementations for sequential logic. The dfflibmap pass maps these generic flip-flops to specific technology library cells as defined in your Liberty file.

- **Matching the Target Process**:
This mapping is important because it replaces the abstract DFF elements with cells that have known characteristics (area, timing, power). It ensures that your synthesized design accurately reflects the behavior of the actual standard cells you plan to use on silicon.


##### In the next post, I will show how to use the synthesis result to do Static Timing Analysis in OpenTimer.





