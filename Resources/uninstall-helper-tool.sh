#! /bin/sh

# This uninstalls everything associated with the privileged helper tool.
# Executing this script reqiures an admin password.

PRIVILEGED_HELPER_LABEL=com.Respondus.LDBHelperTool

sudo launchctl bootout system/$PRIVILEGED_HELPER_LABEL
# OK outputs:
# <nothing> (success)
# 'Boot-out failed: 3: No such process'
# 'Boot-out failed: 36: Operation now in progress'

sudo rm /Library/LaunchDaemons/$PRIVILEGED_HELPER_LABEL.plist
# OK outputs:
# <nothing> (success)
# 'rm: /Library/LaunchDaemons/com.Respondus.LDBHelperTool.plist: No such file or directory'

sudo rm /Library/PrivilegedHelperTools/$PRIVILEGED_HELPER_LABEL
# OK outputs:
# <nothing> (success)
# 'rm: /Library/PrivilegedHelperTools/com.Respondus.LDBHelperTool: No such file or directory'

sudo security -q authorizationdb remove "com.Respondus.LockDownBrowser.uninstall"
sudo security -q authorizationdb remove "com.Respondus.LockDownBrowser.stopService"
sudo security -q authorizationdb remove "com.Respondus.LockDownBrowser.readLicenseKey"
sudo security -q authorizationdb remove "com.Respondus.LockDownBrowser.writeLicenseKey"

sudo defaults delete $PRIVILEGED_HELPER_LABEL licenseKey
# OK outputs:
# <nothing> (success)
# 'Domain (com.Respondus.LDBHelperTool) not found. Defaults have not been changed.'

echo "Querying launchd..."
LAUNCHD_OUTPUT=$(sudo launchctl list | grep $PRIVILEGED_HELPER_LABEL)
if [ -z "$LAUNCHD_OUTPUT" ]
then
      echo "Finished successfully."
else
      echo "WARNING: $PRIVILEGED_HELPER_LABEL is not removed"
fi
