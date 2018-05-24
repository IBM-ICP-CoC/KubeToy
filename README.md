# KubeToy
## v1.3.0

A simple Node.js application that deploys to IBM Cloud Private.  It is used to help explore the functionality of
Kubernetes.  This toy application has a user interface which you can:

* write messages to the log
* intentionally crash the application to view auto repair
* toggle a liveness probe so you can monitor how kuberenetes behaves  
* reads config map and secrets from environment vars and files
* optionally provides tools for reading and writing files to shared storage
