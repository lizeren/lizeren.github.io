When you **reconnect the USB Armory** or **reboot the host machine**, the **NAT rules, IP forwarding settings, and interface names might reset**. To **make connection forwarding persistent**, follow these steps:

---

## ** Make NAT & Forwarding Persistent**
### **Step 1: Enable IP Forwarding Permanently**
The `echo 1 > /proc/sys/net/ipv4/ip_forward` command **only lasts until reboot**. To make it **persistent**, do:

```bash
sudo nano /etc/sysctl.conf
```

Find the line:

```plaintext
#net.ipv4.ip_forward=1
```

Uncomment it (remove `#`) and set it to `1`:

```plaintext
net.ipv4.ip_forward=1
```

Save and exit (`Ctrl + X`, then `Y`, then `Enter`).

Apply changes:

```bash
sudo sysctl -p
```

---

### **Step 2: Make iptables NAT & Forwarding Rules Persistent**
#### **Install iptables-persistent**
On the **host**, install the persistence tool:

```bash
sudo apt install iptables-persistent -y
```

When prompted, **select “Yes”** to save existing rules.

---

#### **Save iptables Rules**
Run:

```bash
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

To restore them at boot, run:

```bash
sudo iptables-restore < /etc/iptables/rules.v4
```

Check that it works after reboot:

```bash
sudo systemctl enable netfilter-persistent
sudo systemctl restart netfilter-persistent
```

---

### **Step 3: Ensure Static IP for USB Armory**
If USB Armory **sometimes gets the wrong IP**, make sure it always gets `192.168.100.2/24` by modifying:

```bash
sudo nano /etc/network/interfaces
```

Ensure it looks like this:

```plaintext
auto usb0
iface usb0 inet static
  address 192.168.100.2
  netmask 255.255.255.0
  gateway 192.168.100.1
  dns-nameservers 8.8.8.8 8.8.4.4
```

Restart networking:

```bash
sudo systemctl restart networking
```

Verify:

```bash
ip a show usb0
```

---

### **Step 4: Create a Startup Script (Alternative)**
If **persistent iptables rules don't apply correctly**, create a **startup script** to reapply NAT settings.

 **Create the script:**
```bash
sudo nano /etc/network/if-up.d/usbarmory-nat
```

 **Add this content:**
```bash
#!/bin/sh
iptables -t nat -A POSTROUTING -s 192.168.100.0/24 -o wlp6s0 -j MASQUERADE
iptables -A FORWARD -i enx1a5589a26942 -o wlp6s0 -j ACCEPT
iptables -A FORWARD -i wlp6s0 -o enx1a5589a26942 -j ACCEPT
```
*(Replace `wlp6s0` with your actual internet interface.)*

 **Make it executable:**
```bash
sudo chmod +x /etc/network/if-up.d/usbarmory-nat
```

Now, every time the host boots, it will **reapply NAT settings**.

---

## **Final Test**
 **Reboot both** host and USB Armory.
 Run on **host**:
   ```bash
   ip a show enx1a5589a26942
   sudo iptables -t nat -L -v -n
   ```
    **Ensure correct IP & NAT settings remain.**

 Try from **USB Armory**:
   ```bash
   ping -c 4 192.168.100.1  # Host reachable?
   ping -c 4 8.8.8.8        # Internet working?
   ```

---

### ** Summary**
| **Issue**  | **Solution** |
|------------|-------------|
| **IP Forwarding resets after reboot** | Modify `/etc/sysctl.conf` & run `sysctl -p` |
| **NAT rules reset after reboot** | Install `iptables-persistent` & save rules |
| **USB Armory loses static IP** | Set static IP in `/etc/network/interfaces` |
| **Still not working after reboot** | Create startup script in `/etc/network/if-up.d/` |

This should **persist your settings permanently**! Try rebooting and see if everything stays connected. 🚀