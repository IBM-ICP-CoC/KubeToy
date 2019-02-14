# KubeToy
## v1.8.0
### Tested with ICP versions: 2.1.0 - 3.1.2

A simple Node.js application that deploys to IBM Cloud Private.  It is used to help 
explore the functionality of Kubernetes.  This toy application has a user interface 
which you can:

* write messages to the log (stdout / stderr)
* intentionally crash the application to view auto repair
* toggle a liveness probe and monitor kuberenetes behavior  
* read config maps and secrets from environment vars and files
* if connected to shared storage, read and write files

KubeToy can be installed via helm chart or directly with these [kubernetes definition 
files](https://github.com/IBM-ICP-CoC/KubeToy/tree/master/deployment).  Version 1.8.0 introduces multiple architecture support (amd64, ppc64le, x390s).

**[Adding Helm chart repository](documentation/AddHelmRepository.md)**
Add the IBM Cloud Private Center of Competency Helm chart repository to your ICP cluster.

**[Deploying KubeToy from Helm Chart](documentation/DeployHelm.md)** Deploy an older version of the chart 
from the Helm catalog, verify it is working, then upgrade to the latest version.

**[Playing with the logs](documentation/Logs.md)** 
Use the app to write to the logs, then view the logs in the UI and via Kibana.

**[Crash the app](documentation/Crash.md)**
Intentionally crash the application and watch it self heal.

**[ConfigMaps and Secrets](documentation/Config.md)** Explore configuration options for apps deployed to ICP.

**[Shared Filesystem](documentation/Filesystem.md)** Use the shared files system to store and read content across all instances of the application.  File information is persisted even if the app crashes.

**[Network](documentation/Network.md)** Ping and do DNS lookups from the server side app.  You can verify visibilty of related ClusterIP services.

**[Ingress](documentation/Ingress.md)** Show how you can, with the help of nginx you can set up an ingress for this app, with your own custom certs providing SSL protection.






