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

### Chrome Directly
`sudo apt install -y -t noble chromium`











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
