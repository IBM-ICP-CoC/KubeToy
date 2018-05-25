# KubeToy
## v1.3.0
### Tested with ICP versions: 2.1.0 - 2.1.0.3

A simple Node.js application that deploys to IBM Cloud Private.  It is used to help 
explore the functionality of Kubernetes.  This toy application has a user interface 
which you can:

* write messages to the log
* intentionally crash the application to view auto repair
* toggle a liveness probe and monitor kuberenetes behavior  
* read config maps and secrets from environment vars and files
* if connected to shared storage, read and write files

KubeToy can be installed via helm chart or directly with these [kubernetes definition 
files](https://github.com/IBM-ICP-CoC/KubeToy/tree/master/deployment).  

**[Adding Helm chart repository](documention/AddHelmRepository.md)**
Add the IBM Cloud Private Center of Competency Helm chart repository to your ICP cluster.

**[Deploying KubeToy from Helm Chart](DeployHelm.md)** Deploy an older version of the chart 
from the Helm catalog, verify it is working, then upgrade to the latest version.







