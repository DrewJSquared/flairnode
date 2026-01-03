# ssh in


## 7. FlairNode Source Code

### Download & Unzip

Install CURL with

`sudo apt install curl`

When prompted, type in sudo password, `jsquared22!`

Download the GitHub repository as a zip file

`curl -L -o flairnode.zip "https://github.com/DrewJSquared/flairnode/archive/refs/heads/main.zip"`

Unzip the downloaded file

`unzip flairnode.zip -d flairnode_tmp`

Move the contents to the flairnode directory

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






## 8. NVM, Node, & PM2 Setup

### Install NVM
`cd ~/ && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash `

Once this script finishes, *COPY THE THINGY SO IT TAKES EFFECT*!

### Install NodeJS, NPM, & PM2
`nvm install 18 && npm install pm2 -g`

### Setup PM2 Processes
`cd ~/flairnode && pm2 start FlairNode.js && pm2 save && pm2 startup`

(and copy/paste startup script to save startup. type in sudo pw when prompted and hit enter)



