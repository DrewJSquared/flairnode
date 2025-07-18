# FlairNode
 
Flair Node device firmware, version 1.0

---

# How To Set Up A New Flair Node

## 1. User Setup

### Root & Users

Root PW: `_`

User: `flair`
PW: `_`

real name: Flair

detected location

don't generate locales (7)

### Hostname:
`sudo nano /etc/hostname`
set to `flairnode`

### Hosts:
`sudo nano /etc/hosts`
set to `flairnode` where relvant

### Reboot
Flip switch to MMC for reboot to work properly then reboot. 

- Switch to ssh from this point forward for ease

## 2. GETTY TTY1 SERVICE

### Create Service Directory & Files

`sudo mkdir -p /etc/systemd/system/getty@tty1.service.d`

`sudo nano /etc/systemd/system/getty@tty1.service.d/override.conf`

### Service File
```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin flair --noclear %I $TERM
```

### Start It
`sudo systemctl daemon-reexec && sudo systemctl daemon-reload`

`sudo reboot`


## 3. Install GUI Layer

### Installs

`sudo apt update`

```
sudo apt install -y --no-install-recommends \
  xserver-xorg \
  x11-xserver-utils \
  xinit \
  openbox \
  unclutter \
  xdotool \
  unzip
```

### Install Chrome Directly
`sudo apt install -y -t noble chromium`


## 4. BASH PROFILE
Setup bash profile script

`cd /home/flair/ && sudo nano .bash_profile`

Contents
```
if [ -f ~/.bashrc ]; then
  . ~/.bashrc
fi

if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
        echo "Launching X server via .bash_profile..."
        startx > /dev/null 2>&1
fi
```

## 5. Xserver Config (window management)
Open config file:

`nano ~/.xinitrc`

Contents:
```
#!/bin/sh

# Start the window manager first
openbox-session &

# Wait briefly to ensure X and Openbox are ready
sleep 0.5

# Disable screen blanking and power saving
xset s off           # Disable screen saver
xset s noblank       # Prevent screen blanking
xset -dpms           # Disable energy-saving features
xset dpms 0 0 0      # Just in case, set timers to 0

# Move mouse to bottom-right corner (1920x1080 screen)
xdotool mousemove 1919 1079

# Hide cursor after 1 second of inactivity
unclutter -idle 1 &

# Launch Chromium in kiosk mode — this stays in foreground
chromium \
        --noerrdialogs \
        --disable-infobars \
        --disable-session-crashed-bubble \
        --disable-translate \
        --disable-features=TranslateUI \
        --disable-component-update \
        --disable-background-networking \
        --disable-sync \
        --metrics-recording-only \
        --no-first-run \
        --autoplay-policy=no-user-gesture-required \
        --start-fullscreen \
        --kiosk file:///home/flair/flairnode/render.html \
        --window-size=1920,1080 \
        --window-position=0,0 \
        --window-background-color="#000000" \
  --force-device-scale-factor=1 \
        --user-data-dir=/home/flair/.flair-profile
```


## 6. Boot Config

### Boot Setup

Open file

`sudo nano /boot/armbianEnv.txt`

File contents:
```
verbosity=0
bootlogo=true
disp_mode=1920x1080p60
console=serial
overlay_prefix=meson
rootdev=UUID=f5fb71ca-255e-4afd-b19f-047a7ac3bfa2
rootfstype=ext4
usbstoragequirks=0x2537:0x1066:u,0x2537:0x1068:u
extraargs=splash quiet vt.global_cursor_default=0 consoleblank=0
```

Then recompile: 

`cd /boot && sudo mkimage -C none -A arm -T script -d boot.cmd boot.scr`

### Disable MOTD:

`sudo chmod -x /etc/update-motd.d/*`

### Passwordless Shutdown

Open sudo file

`sudo visudo`

Add this line to end

`flair ALL=(ALL) NOPASSWD: /usr/sbin/shutdown`





## 7. FlairNode Source Code

### Download & Unzip
Download the GitHub repository as a zip file

`cd /home/flair/ && curl -L -o flairnode.zip "https://github.com/DrewJSquared/flairnode/archive/refs/heads/main.zip"`

Unzip the downloaded file

`unzip flairnode.zip -d flairnode_tmp`

Move the contents to the attitudecontrol2a directory

`rsync -av --remove-source-files flairnode_tmp/flairnode-main/ ./flairnode`

Clean up temporary files

`rm -rf flairnode.zip flairnode_tmp`


### Setup Device ID

Create id.json

`nano id.json`

Copy/Paste the following for id.json

```
{
  "device_id":1,
  "serialnumber":"FN-00100XX"
}
```


### Set Timezone
`sudo ln -sf /usr/share/zoneinfo/America/Chicago /etc/localtime && sudo dpkg-reconfigure -f noninteractive tzdata`






## 8. NVM, Node, & PM2 Setup

### Install NVM
`cd /home/flair/ && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash `

Once this script finishes, *COPY THE THINGY SO IT TAKES EFFECT*!

### Install NodeJS, NPM, & PM2
`nvm install 18 && npm install pm2 -g`

### Setup PM2 Processes
`cd /home/flair/flairnode && pm2 start FlairNode.js && pm2 save && pm2 startup`

(and copy/paste startup script to save startup)







## 9. Reverse Tunnel SSH
Install autossh & test connection: `sudo apt install autossh && autossh -R flairnode-00100XX:22:localhost:22 serveo.net`
(Be sure to change the serial number!)
(and test connection and accept key for Serveo.net else it wont work!!!)

Setup service file: `sudo nano /etc/systemd/system/flairssh.service`

Copy this into the new file: 
```
[Unit]
Description=Flair Node SSH
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=flair
ExecStart=autossh -R flairnode-00100XX:22:localhost:22 serveo.net

[Install]
WantedBy=multi-user.target
```
(Be sure to change the serial number!)

Start service: `sudo systemctl start flairssh.service && sudo systemctl enable flairssh.service`






## 10. USB Auto Mount Service
Made my own auto usb mount service

### Auto Mount

Setup:

`sudo nano /usr/local/bin/flair-usb-automount`


File Contents:

```
#!/bin/bash

echo "[flair-usb-automount] Watching for /dev/sda1 add/remove events..."

MOUNT_DIR="/media/usb0"

udevadm monitor --udev --subsystem-match=block | while read -r line; do
  if echo "$line" | grep -q 'add' && echo "$line" | grep -q 'sda1'; then
    echo "[flair-usb-automount] Detected /dev/sda1 add event!"

    if mount | grep -q '/dev/sda1'; then
      echo "[flair-usb-automount] /dev/sda1 is already mounted."
    else
      echo "[flair-usb-automount] Mounting /dev/sda1 to $MOUNT_DIR"
      sudo mkdir -p "$MOUNT_DIR"
      if sudo mount /dev/sda1 "$MOUNT_DIR"; then
        echo "[flair-usb-automount] Successfully mounted to $MOUNT_DIR"
      else
        echo "[flair-usb-automount] Failed to mount /dev/sda1"
      fi
    fi
  fi

  if echo "$line" | grep -q 'remove' && echo "$line" | grep -q 'sda1'; then
    echo "[flair-usb-automount] Detected /dev/sda1 removal event!"

    if mount | grep -q '/dev/sda1'; then
      echo "[flair-usb-automount] Unmounting /dev/sda1 from $MOUNT_DIR"
      if sudo umount /dev/sda1; then
        echo "[flair-usb-automount] Successfully unmounted."
        sudo rmdir "$MOUNT_DIR" 2>/dev/null
      else
        echo "[flair-usb-automount] Failed to unmount /dev/sda1"
      fi
    else
      echo "[flair-usb-automount] /dev/sda1 was not mounted."
    fi
  fi
done
```

Make executable:

`sudo chmod +x /usr/local/bin/flair-usb-automount`


### Setup systemd service

Command:

`sudo nano /etc/systemd/system/flair-usb-automount.service`


File Contents:

```
[Unit]
Description=Flair USB Auto-Mount Service
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/local/bin/flair-usb-automount
Restart=always
RestartSec=2
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable:

`sudo systemctl daemon-reload && sudo systemctl enable --now flair-usb-automount.service`



