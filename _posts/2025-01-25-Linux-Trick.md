---
title: 'Linux Trick'
date: 2025-01-25
permalink: /posts/2025/01/Linux-Trick/
tags:
- Articles
---

Useful Linux commands and tricks to solve common problems

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
source: [How to Create a Shortcut for an AppImage on Ubuntu](https://www.linuxadictos.com/2022/01/24/how-to-create-a-shortcut-for-an-appimage-on-ubuntu/)