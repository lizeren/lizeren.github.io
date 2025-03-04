---
title: "Source-Binary Viewer Tool"
excerpt: "A tool for comparing and viewing changes between source code and decompiled binary <br/><img src='/images/src-bin-viewer.png'>"

collection: project
---

![Source-Binary Viewer Tool](/images/src-bin-viewer.png)

## Overview

This tool compares and visualizes differences between source code and decompiled binary. 

## Features

Each function analysis includes:

- Number of parameters
- Stack size of parameters
- Stack size of local variables
- Number of local variables
- And more metrics of interest to binary analysts

## Implementation

The src-dec system consists of two main components:
1. Feature extraction from source code
2. Feature extraction from decompiled binary