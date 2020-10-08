#!/usr/bin/env sh

echo 'foobarbaz' > pass
rm -f ./key ./key.pub ./key.pub.pem
ssh-keygen -f ./key -t rsa -b 4096 -m PEM -n $(cat pass) -N 'some-pass'
# ssh-keygen -f ./key -t rsa -b 4096 -m PEM -n $(cat pass)
ssh-keygen -f ./key.pub -e -m pem > key.pub.pem