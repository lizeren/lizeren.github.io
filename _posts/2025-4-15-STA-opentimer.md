---
title: 'VLSIDesignChain: 2 - Static Timing Analysis by OpenTimer '
date: 2025-04-15
permalink: /posts/2025/04/vlsi-design-chain-2/
tags:
  - VLSI
  - Articles
---

## Static Timing Analysis by OpenTimer
OpenTimer is a static timing analysis tool and it is a part of the OpenROAD suite of tools. But today we will use OpenTimer standalone.

## Preparing the Synthesis Result for STA
This time we will write a simple counter to test the timing of the design.
```verilog
// counter.v
module counter (clk, rst, en, count);
	input clk, rst, en;
	output reg [1:0] count;
	always @(posedge clk)
		if (rst)
			count <= 2'd0;
		else if (en)
			count <= count + 2'd1;
endmodule
```
From the last post, we synthesized the design step by step in Yosys. Yosys supports executing scripts, so here we combine the commmands into a script
```bash
# synth_asic.ys
read_verilog counter.v
hierarchy -check -top counter
proc; opt
memory; opt
fsm; opt
techmap; opt
# change the path based on your file location
dfflibmap -liberty /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/stdcells.lib
abc -liberty /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/stdcells.lib
clean
write_verilog -noexpr -noattr counter_asic_FreePDK45.v
```
To run the script
```bash
yosys -s synth_asic.ys
```
You will get a synthesized Verilog file `counter_asic_FreePDK45.v`.

**However**, we need to remove assign statements in the Verilog file. This is because OpenTimer reads gate-level (aka structural) verilog files (.v) to initialize circuit netlists. Logics are described by gates and modules only. There are no always blocks or assign statements. [Source](https://github.com/OpenTimer/OpenTimer/blob/master/wiki/io/verilog.md). So we need to remove the assign statements in the last line of the Verilog file.
```verilog
  DFF_X1 _15_ (
    .CK(clk),
    .D(_01_),
    .Q(count[1]),
    .QN(_06_)
  );
  // assign _07_[1] = count[1];
```
## Composing a SDC file
SDC is a timing constraint file that describes the timing requirements of the design. Here I follow the example SDC file provided by OpenTimer [Link](https://github.com/OpenTimer/OpenTimer/blob/master/example/simple/simple.sdc). You can refer back to the synthesized verilog [file](https://github.com/OpenTimer/OpenTimer/blob/master/example/simple/simple.v) privided by OpenTimer to see more details.
```bash
# counter.sdc
# -----------------------------------------------------------------------------
# SDC constraints for the counter module (mimicking the provided SDC style)
# -----------------------------------------------------------------------------

# Create a clock named "clk" with a 50 ns period.
create_clock -period 50 -name clk [get_ports clk]

# Set input delay constraints for the clock port "clk"
set_input_delay 0 -min -rise [get_ports clk] -clock clk
set_input_delay 25 -min -fall [get_ports clk] -clock clk
set_input_delay 0 -max -rise [get_ports clk] -clock clk
set_input_delay 25 -max -fall [get_ports clk] -clock clk

# Set input delay constraints for "rst"
set_input_delay 0 -min -rise [get_ports rst] -clock clk
set_input_delay 0 -min -fall [get_ports rst] -clock clk
set_input_delay 5 -max -rise [get_ports rst] -clock clk
set_input_delay 5 -max -fall [get_ports rst] -clock clk

# Set input delay constraints for "en"
set_input_delay 0 -min -rise [get_ports en] -clock clk
set_input_delay 0 -min -fall [get_ports en] -clock clk
set_input_delay 1 -max -rise [get_ports en] -clock clk
set_input_delay 1 -max -fall [get_ports en] -clock clk

# Set input transition constraints for "rst"
set_input_transition 10 -min -rise [get_ports rst] -clock clk
set_input_transition 15 -min -fall [get_ports rst] -clock clk
set_input_transition 20 -max -rise [get_ports rst] -clock clk
set_input_transition 25 -max -fall [get_ports rst] -clock clk

# Set input transition constraints for "en"
set_input_transition 30 -min -rise [get_ports en] -clock clk
set_input_transition 30 -min -fall [get_ports en] -clock clk
set_input_transition 40 -max -rise [get_ports en] -clock clk
set_input_transition 40 -max -fall [get_ports en] -clock clk

# Set input transition constraints for the clock "clk"
set_input_transition 10 -min -rise [get_ports clk] -clock clk
set_input_transition 15 -min -fall [get_ports clk] -clock clk
set_input_transition 10 -max -rise [get_ports clk] -clock clk
set_input_transition 15 -max -fall [get_ports clk] -clock clk

# Set a load constraint for the output port "count"
set_load -pin_load 4 [get_ports count]

# Set output delay constraints for "count"
set_output_delay -10 -min -rise [get_ports count] -clock clk
set_output_delay -10 -min -fall [get_ports count] -clock clk
set_output_delay 30 -max -rise [get_ports count] -clock clk
set_output_delay 30 -max -fall [get_ports count] -clock clk
```

## Generate STA by OpenTimer
Now we have everything read for OpenTimer to generate a STA report.
```bash
~$ ./bin/ot-shell
  ____              _______              
 / __ \___  ___ ___/_  __(_)_ _  ___ ____
/ /_/ / _ \/ -_) _ \/ / / /  ' \/ -_) __/
\____/ .__/\__/_//_/_/ /_/_/_/_/\__/_/       v2
    /_/                                     
MIT License: type "license" to see more details.
For help, type "help".
For bug reports, issues, and manual, please see:
<https://github.com/OpenTimer/OpenTimer>.
ot> 
```
```bash
# change the path based on your file location
ot> read_celllib /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/stdcells.lib
ot> read_verilog /mnt/linuxstorage/vlsi-open-source-tool/case_study/fifo/counter_asic_FreePDK45.v  
ot> read_sdc /mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/counter.sdc
ot> report_timing
```
Here is the output of the STA report.
```bash
I 50752 25-04-15 15:43:38 sdc.cpp:35] loading sdc "/mnt/linuxstorage/vlsi-open-source-tool/case_study/freepdk-45nm/pkgs/base/counter.sdc" ...
I 50752 25-04-15 15:43:38 sdc.cpp:21] added 30 sdc commands
Startpoint    : rst
Endpoint      : _15_:D
Analysis type : max
------------------------------------------------------
       Type       Delay        Time   Dir  Description
------------------------------------------------------
       port       5.000       5.000       0.000  fall  rst
        pin       0.000       5.000       0.000  fall  _13_:A1 (NOR3_X1)
        pin       7.183      12.183     330.287  rise  _13_:ZN (NOR3_X1)
        pin       0.000      12.183       0.000  rise  _15_:D (DFF_X1)
    arrival                  12.183        data arrival time

related pin      10.000      10.000  rise  _15_:CK (DFF_X1)
 constraint       2.486      12.486        library setup_rising
   required                  12.486        data required time
------------------------------------------------------
      slack                   0.303        MET

```

##### In the next post, I will show how to use nextpnr to do place and route on a FPGA design.
