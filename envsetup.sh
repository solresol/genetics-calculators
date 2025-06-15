#!/bin/bash
# Install dependencies for running Selenium tests headlessly
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)" >&2
  exit 1
fi

apt-get update

# Firefox setup from the Mozilla repository
apt-get install -y wget gpg apt-transport-https curl
install -d -m 0755 /etc/apt/keyrings
wget -q https://packages.mozilla.org/apt/repo-signing-key.gpg -O- \
  | tee /etc/apt/keyrings/packages.mozilla.org.asc > /dev/null
gpg -n -q --import --import-options import-show /etc/apt/keyrings/packages.mozilla.org.asc \
  | awk '/pub/{getline; gsub(/^ +| +$/,"",$0); if($0 == "35BAA0B33E9EB396F59CA838C0BA5CE6DC6315A3") print "\nThe key fingerprint matches ("$0").\n"; else { print "\nVerification failed: the fingerprint ("$0") does not match the expected one.\n"; exit 1 }}'
echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.asc] https://packages.mozilla.org/apt mozilla main" \
  > /etc/apt/sources.list.d/mozilla.list
cat <<'EOP' > /etc/apt/preferences.d/mozilla
Package: *
Pin: origin packages.mozilla.org
Pin-Priority: 1000
EOP
apt-get update
apt-get install -y firefox

# Install geckodriver for controlling Firefox
GECKO_URL="https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz"
curl -L "$GECKO_URL" -o /tmp/geckodriver.tar.gz
tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin
chmod +x /usr/local/bin/geckodriver
rm /tmp/geckodriver.tar.gz

# Optional: tools for headless browsing
apt-get install -y xvfb

# Node dependencies including Selenium bindings
npm install
npm install --save-dev selenium-webdriver

echo "Environment setup complete."
