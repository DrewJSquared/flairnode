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
`nano /etc/hostname`
set to `flairnode`

### Hosts:
`nano /etc/hosts`
set to `flairnode` where relvant

- Switch to ssh from this point forward

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
  xdotool
```

### Install Chrome Directly
`sudo apt install -y -t noble chromium`


## 4. BASH PROFILE
Setup bash profile script
`cd /home/flair/ && sudo nano .bash_profile`

Contents
```
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
        --kiosk file:///home/flair/usbvideo.html \
        --window-size=1920,1080 \
        --window-position=0,0 \
        --window-background-color="#000000" \
  --force-device-scale-factor=1 \
        --user-data-dir=/home/flair/.flair-profile
```


## 6. Boot Config
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

Disable MOTD:???????
`sudo systemctl disable armbian-motd`





## How to Install From Scratch
Download the GitHub repository as a zip file
`curl -L -o attitudecontrol2a.zip "https://github.com/DrewJSquared/attitudecontrol2a/archive/refs/heads/main.zip"`

Unzip the downloaded file
`unzip attitudecontrol2a.zip -d attitudecontrol2a_tmp`

Move the contents to the attitudecontrol2a directory
`rsync -av --remove-source-files attitudecontrol2a_tmp/attitudecontrol2a-main/ ./attitudecontrol2a`

Clean up temporary files
`rm -rf attitudecontrol2a.zip attitudecontrol2a_tmp`

Create id.json
`nano id.json`

Copy/Paste the following for id.json
```
{
  "device_id":1,
  "serialnumber":"AC-00200XX"
}
```
