# Kubetoy 
A Kubernetes Toy Application

This a simple Node.js app to be used with IBM Cloud Private demos.  It helps explore kubernetes deployments and persistent volumes.



## Configuration

### Parameters

This Helm chart has only a few values that can be overriden using the --set parameter.  The replica count is the only interesting value that might be overriden.

` helm install --name my-toy --set replicaCount=3  `


