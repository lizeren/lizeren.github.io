---
title: 'Linux Trick'
date: 2025-01-25
permalink: /posts/2025/01/Linux-Trick/
tags:
- Articles
---

Useful Linux commands and tricks to solve common problems

## Table of Contents
- [Only one monitor is working](#only-one-monitor-is-working)
- [Create shortcut for AppImage](#create-shortcut-for-appimage)
- [Switch a monitor between hdmi and dp](#switch-a-monitor-between-hdmi-and-dp)

# Only one monitor is working
When you update your kernel or install a new Linux distribution, it's possible that the NVIDIA driver you were using needs to be reinstalled or updated.

Reinstall or Update NVIDIA Driver.
1.Remove the current driver
```bash
sudo apt purge nvidia*
```
2.Add the NVIDIA PPA (if not already added)
```bash
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update
```
3.Install the recommended driver for your GPU
```bash
sudo ubuntu-drivers autoinstall
```
4.Reboot your system
```bash
sudo reboot
```

# Create shortcut for AppImage

AppImage is a packaging format that simplifies software distribution on Linux systems. Today, we are going to take a look at how to create a shortcut for an AppImage on Ubuntu.

To begin with, open a terminal and use the `cd` command to go to the directory where the AppImage file is located.
Then, we have to create a Desktop Entry File. Desktop entry files have a .desktop extension and contain information about the application. We can use a text editor like `vim` or `gedit` to create one:
```bash
vim myapp.desktop
```

Remember to replace `myapp.desktop` with a name for the desktop entry file.

Add details like application name, executable path, icon path, etc to the file.
For example:


```bash
[Desktop Entry]
Type=Application
Name=MyApp
Exec=/path/to/our_appimage_file
Icon=/path/to/icon_file
```

We have to replace `/path/to/our_appimage_file` with the actual path to the AppImage file and `/path/to/icon_file` with the desired icon file’s path.

Then, save the desktop entry file and exit the text editor.
At this point, use the `chmod` command to make the desktop entry file executable:
```bash
chmod +x myapp.desktop
```

To make sure the application appears in the application menu, move the desktop entry file to the `~/.local/share/applications/` directory:
```bash
mv myapp.desktop ~/.local/share/applications/
```

Finally, update the desktop database so that the system recognizes the new desktop entry:
```bash
update-desktop-database ~/.local/share/applications/
```
What if after an update, the name of the application is changed?
### Step 1: Create a Symlink to the Latest AppImage
Run the following command:

Step 2: Update Your .desktop File```bash
#use Cursor IDE as an example
```bash
ln -sf ~/Downloads/cursor-*.AppImage ~/Downloads/Cursor.AppImage
```
This will create (or update) a symlink named Cursor.AppImage that always points to the most recent version.
### Step 2: Update Your .desktop File
Modify your cursor.desktop file (located at ~/.local/share/applications/cursor.desktop) so that it points to the symlink instead of the actual AppImage:

```bash
[Desktop Entry]
Type=Application
Name=Cursor
Exec=/home/lizeren/Downloads/Cursor.AppImage
Icon=/home/lizeren/Downloads/cursor.png
```
refresh the desktop database:
```bash
update-desktop-database ~/.local/share/applications/
```
### Step 3: Run This Command After Updating the AppImage
Each time you download a new version of Cursor.AppImage into ~/Downloads, just run:

```bash
ln -sf ~/Downloads/cursor-*.AppImage ~/Downloads/Cursor.AppImage
```
This will update the symlink so that the shortcut keeps working without needing to edit the .desktop file.
source: [How to Create a Shortcut for an AppImage on Ubuntu](https://www.linuxadictos.com/2022/01/24/how-to-create-a-shortcut-for-an-appimage-on-ubuntu/)

# Switch a monitor between hdmi and dp

I have three monitors. The main one is a ROG 2k 240hz monitor, one is a 2k 144hz Dell monitor. The last one is a 1080p 240hz monitor, which I connect to my laptop via DP and HDMI to other devices such as Raspberry Pi, Macbook and Nvidia Shield. Usually when I want to switch the 1080p monitor from HDMI to DP, I encounter a problem that all three monitors will get scaled up by 200%, which is annoying.

```bash
$ xrandr
Screen 0: minimum 8 x 8, current 5120 x 1440, maximum 32767 x 32767
HDMI-0 disconnected (normal left inverted right x axis y axis)
DP-0 connected primary 2560x1440+2560+0 (normal left inverted right x axis y axis) 1mm x 1mm
   2560x1440     59.95 + 240.02*  165.02   144.01   120.00    99.95  
   1920x1080    119.88   100.00    60.00    59.94    50.00  
   1440x900      59.89  
   1440x576      50.00  
   1440x480      59.94  
   1280x1024     75.02    60.02  
   1280x720      59.94    50.00  
   1152x864      75.00  
   1024x768      75.03    70.07    60.00  
   800x600       75.00    72.19    60.32    56.25  
   720x576       50.00  
   640x480       75.00    72.81    59.94  
DP-1 disconnected (normal left inverted right x axis y axis)
DP-2 connected 2560x1440+0+0 (normal left inverted right x axis y axis) 598mm x 336mm
   2560x1440     59.95 + 144.00*  120.00    99.95    84.98    23.97  
   1024x768      60.00  
   800x600       60.32  
   640x480       59.94  
DP-3 disconnected (normal left inverted right x axis y axis)
DP-4 connected (normal left inverted right x axis y axis)
   1920x1080     60.00 + 239.76   143.98   119.98    59.94    50.00  
   1600x900      60.00  
   1280x1024     75.02    60.02  
   1280x720      59.94    50.00  
   1152x864      75.00  
   1024x768      75.03    60.00  
   800x600       75.00    60.32  
   720x576       50.00  
   720x480       59.94  
   640x480       75.00    59.94    59.93 
```



To solve this problem, you can run this script to bring the 1080p monitor from HDMI to DP while keeping the other two monitors at their original scale.

```bash
#!/usr/bin/env bash

# makes the script exit immediately if any command fails, instead of continuing and leaving things in a half-broken state.
set -e 

# If you’re on GNOME/X11 or Wayland, make sure DE scaling is 100%
# (No-op on non-GNOME)
if command -v gsettings >/dev/null 2>&1; then
  gsettings set org.gnome.desktop.interface scaling-factor 1 || true
fi

# Global DPI (harmless if already 96)
xrandr --dpi 96

# Ensure each output is 1:1 (clears any per-output scaling)
xrandr --output DP-2 --scale 1x1
xrandr --output DP-0 --scale 1x1
xrandr --output DP-4 --scale 1x1

# Light up displays and place them. Based on your dump:
# DP-2 (2560x1440) at left, DP-0 (2560x1440) center/primary,
# DP-4 (1920x1080) to the right, vertically centered.
xrandr \
  --output DP-2 --mode 2560x1440 --pos 0x0 --rate 144 \
  --output DP-0 --mode 2560x1440 --pos 2560x0 --primary --rate 240 \
  --output DP-4 --mode 1920x1080 --rate 239.76 --pos 5120x360

```

To run this script, first make it executable then run it:

```bash
chmod +x ~/bin/bring_1080_back.sh
bash ~/bin/bring_1080_back.sh
```
you can also create an alias for this script so that you can run it with a single command **1080back**:
In your `.bashrc` file, add the following line:
```bash
vim ~/.bashrc
```
```bash
alias 1080back="bash ~/bin/bring_1080_back.sh"
```
```bash
source ~/.bashrc
```

Now you can run the script with a single command:
```bash
1080back
```
<details>
<summary>Bash script explanation</summary>

### 1. Script header + safety

```bash
#!/usr/bin/env bash
set -e
```

* `#!/usr/bin/env bash` → tells the system to run the script with Bash.
* `set -e` → makes the script exit immediately if any command fails, instead of continuing and leaving things in a half-broken state.

---

### 2. Reset DE (Desktop Environment) scaling

```bash
if command -v gsettings >/dev/null 2>&1; then
  gsettings set org.gnome.desktop.interface scaling-factor 1 || true
fi
```

* `gsettings` is the config tool for **GNOME**.
* `scaling-factor 1` = force 100% UI scaling (no fractional zoom).
* If you’re on KDE or another DE, this part does nothing (`command -v gsettings` makes sure it only runs if available).
* The `|| true` ensures the script won’t break even if GNOME ignores the command.

Purpose: Avoid the “200% scaling” issue you were seeing.

---

### 3. Force global DPI

```bash
xrandr --dpi 96
```

* This sets Xorg’s logical DPI to **96**, which is the standard “normal” DPI.
* It overrides any bogus EDID values (like `1mm × 1mm`) that could otherwise trick the system into thinking the screen needs HiDPI scaling.

Purpose: Ensures consistent font/UI rendering across all monitors.

---

### 4. Clear per-monitor scaling

```bash
xrandr --output DP-2 --scale 1x1
xrandr --output DP-0 --scale 1x1
xrandr --output DP-4 --scale 1x1
```

* Each monitor (`DP-2`, `DP-0`, `DP-4`) is explicitly told **no scaling** (`1x1`).
* Sometimes after hot-plugging, Xorg keeps an odd scale factor (like `2x2`), which doubles everything — this clears it.

Purpose: Guarantees all displays are running pixel-for-pixel.

---

### 5. Turn on monitors + position them

```bash
xrandr \
  --output DP-2 --mode 2560x1440 --pos 0x0 --rate 144 \
  --output DP-0 --mode 2560x1440 --pos 2560x0 --primary --rate 240 \
  --output DP-4 --mode 1920x1080 --rate 239.76 --pos 5120x360
```

* `--output DP-2 --mode 2560x1440 --pos 0x0 --rate 144`
  → Lights up `DP-2` at 2560×1440, refresh 144 Hz, placed at the **left** edge (0,0).

* `--output DP-0 --mode 2560x1440 --pos 2560x0 --primary --rate 240`
  → Lights up `DP-0` next to DP-2 (so it starts at x=2560), makes it **primary**, refresh 240 Hz.

* `--output DP-4 --mode 1920x1080 --rate 239.76 --pos 5120x360`
  → Places `DP-4` to the **right** of DP-0 (x=5120).

  * The `y=360` vertically offsets it so the 1080-tall screen is centered against the 1440-tall ones ( (1440−1080)/2 = 360 ).

Purpose: Brings all 3 monitors back in a fixed, predictable layout, no matter what the hotplug mess does.

</details>
