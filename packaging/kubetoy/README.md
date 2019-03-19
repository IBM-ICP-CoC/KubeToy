# Kubetoy 1.9.0

A Kubernetes Toy Application

This a simple Node.js app to be used with IBM Cloud Private demos.  It helps explore kubernetes deployments, config maps, secrets and optionally (persistent volumes)

See the GitHub [documentation](https://github.com/IBM-ICP-CoC/KubeToy) for examples of how to use this app.

This 1.9.0 includes a page to work with cloud object storage (S3) as 
configured by a cofigmap.


## Configuration

storage:
  useSharedStorage: false
  createPvc: false
  useStorageClass: false
  storageClassName: "glusterfs"
  accessMode: "ReadWriteMany"
cos:
  useCouldObjectStorage: false
  bucket: "kubetoy"
  endpoint: "",
  accessKeyId": "",
  secretAccessKey": ""

The following tables lists the configurable parameters of the Jenkins chart and their default values.

|         Parameter            |                       Description                       |           Default          |
|------------------------------|---------------------------------------------------------|----------------------------|
| `arch.amd64`                  | `Amd64 worker node scheduler preference in a hybrid cluster` | `2 - No preference` - worker node is chosen by scheduler       |
| `arch.ppc64le`                | `Ppc64le worker node scheduler preference in a hybrid cluster` | `2 - No preference` - worker node is chosen by scheduler       |
| `arch.s390x`                  | `S390x worker node scheduler preference in a hybrid cluster` | `2 - No preference` - worker node is chosen by scheduler       |
| `image.repository`         | The repository and image name                           | `ibmicpcoc/kubetoy`      |
| `image.pullPolilcy`        | The pull policy for images                              | `IfNotPresent`            |
| `service.name`              | The name of the service resource                        | `kubetoy-service`        |
| `storage.useSharedStorage` | Enabled, Indicates that shared storage is used (filesystem tab)            | `false`                    |
| `storage.createPvc`         | Enabled, Indicates that a new PVC is created            | `false`                    |
| `storage.useStorageClass`   | Use dynamic provisioning        | `false`             |
| `storage.storageClassName`   | The name of the storage class to use for dynamic provisioning       | `glusterfs`             |
| `storage.accessmode`       | The access mode for persistent storage volume           | `ReadWriteMany`                 |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
$ helm install --name my-kubetoy-release \
  --set image.pullPolilcy=Always \
    ibmicpcoc/kubetoy
```

The above command sets the image pull policy to always.

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
$ helm install --name my-kubetoys-release -f values.yaml ibmicpcoc/kubetoy
```

> **Tip**: You can use the default [values.yaml](values.yaml)



## Copyright
© Copyright IBM Corporation 2019. All Rights Reserved.