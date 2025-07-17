# FlairNode
 
Flair Node device firmware, version 1.0


## How To Set Up A New Flair Node

### 1. User Setup

Root PW: `_`

User: `flair`
PW: `_`

real name: Flair

detected location

don't generate locales (7)

Hostname:
`nano /etc/hostname`
set to `flairnode`

Hosts:
`nano /etc/hosts`
set to `flairnode` where relvant

- Switch to ssh from this point forward






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
