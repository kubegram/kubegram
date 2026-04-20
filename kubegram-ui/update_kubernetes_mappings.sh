#!/bin/bash

# Update kubernetes-mappings.json with descriptions for each resource
cd /Users/salehshehata/github.com/kubegram/kubegram/kubegram-ui/public

cat > kubernetes-mappings.json << 'EOF'
{
  "API": {
    "icon": "kubernetes/resources/labeled/api.svg",
    "description": "API Server is the central management entity that validates and configures data for API objects"
  },
  "CCM": {
    "icon": "kubernetes/resources/labeled/c-c-m.svg",
    "description": "Cloud Controller Manager integrates Kubernetes with cloud provider APIs"
  },
  "CM": {
    "icon": "kubernetes/resources/labeled/c-m.svg",
    "description": "Controller Manager runs controller processes that regulate the state of the cluster"
  },
  "CRole": {
    "icon": "kubernetes/resources/labeled/c-role.svg",
    "description": "ClusterRole is a non-namespaced role that grants permissions cluster-wide"
  },
  "ConfigMap": {
    "icon": "kubernetes/resources/labeled/cm.svg",
    "description": "ConfigMap stores non-confidential configuration data as key-value pairs for use by Pods and other components"
  },
  "Control Plane": {
    "icon": "kubernetes/resources/labeled/control-plane.svg",
    "description": "Control Plane makes global decisions about cluster management and responds to cluster events"
  },
  "CRB": {
    "icon": "kubernetes/resources/labeled/crb.svg",
    "description": "ClusterRoleBinding grants permissions defined in a ClusterRole to users, groups, or service accounts cluster-wide"
  },
  "CRD": {
    "icon": "kubernetes/resources/labeled/crd.svg",
    "description": "Custom Resource Definition extends Kubernetes API with custom resources"
  },
  "CronJob": {
    "icon": "kubernetes/resources/labeled/cronjob.svg",
    "description": "CronJob creates Jobs on a repeating schedule using cron format"
  },
  "Deployment": {
    "icon": "kubernetes/resources/labeled/deploy.svg",
    "description": "Deployment provides declarative updates for Pods and ReplicaSets, managing application lifecycle"
  },
  "DaemonSet": {
    "icon": "kubernetes/resources/labeled/ds.svg",
    "description": "DaemonSet ensures that all (or some) Nodes run a copy of a Pod"
  },
  "Endpoints": {
    "icon": "kubernetes/resources/labeled/ep.svg",
    "description": "Endpoints expose network endpoints that implement a Service"
  },
  "Etcd": {
    "icon": "kubernetes/resources/labeled/etcd.svg",
    "description": "etcd is a consistent and highly-available key value store used as Kubernetes' backing store"
  },
  "Group": {
    "icon": "kubernetes/resources/labeled/group.svg",
    "description": "Group represents a collection of users for authorization purposes"
  },
  "HPA": {
    "icon": "kubernetes/resources/labeled/hpa.svg",
    "description": "Horizontal Pod Autoscaler automatically scales the number of Pods based on observed CPU/Memory utilization"
  },
  "Ingress": {
    "icon": "kubernetes/resources/labeled/ing.svg",
    "description": "Ingress manages external access to services in a cluster, typically HTTP/HTTPS, with load balancing and SSL termination"
  },
  "Job": {
    "icon": "kubernetes/resources/labeled/job.svg",
    "description": "Job creates one or more Pods to perform a specific task and ensures they complete successfully"
  },
  "KProxy": {
    "icon": "kubernetes/resources/labeled/k-proxy.svg",
    "description": "Kube Proxy maintains network rules on nodes, enabling network communication to your Pods"
  },
  "Kubelet": {
    "icon": "kubernetes/resources/labeled/kubelet.svg",
    "description": "Kubelet is the primary node agent that ensures containers are running in a Pod"
  },
  "Limits": {
    "icon": "kubernetes/resources/labeled/limits.svg",
    "description": "LimitRange sets default resource requests/limits for namespaces and constrains resource usage"
  },
  "NetworkPolicy": {
    "icon": "kubernetes/resources/labeled/netpol.svg",
    "description": "NetworkPolicy specifies how groups of Pods are allowed to communicate with each other and other network endpoints"
  },
  "Node": {
    "icon": "kubernetes/resources/labeled/node.svg",
    "description": "Node is a worker machine in Kubernetes that runs containerized applications"
  },
  "Namespace": {
    "icon": "kubernetes/resources/labeled/ns.svg",
    "description": "Namespace provides a mechanism to isolate groups of resources within a single cluster"
  },
  "Pod": {
    "icon": "kubernetes/resources/labeled/pod.svg",
    "description": "Pod is the smallest deployable unit in Kubernetes, containing one or more containers"
  },
  "PodSecurityPolicy": {
    "icon": "kubernetes/resources/labeled/psp.svg",
    "description": "PodSecurityPolicy controls security sensitive aspects of Pod specification (deprecated in favor of Pod Security Standards)"
  },
  "PersistentVolume": {
    "icon": "kubernetes/resources/labeled/pv.svg",
    "description": "PersistentVolume is a storage resource in the cluster that has been provisioned by an administrator"
  },
  "PersistentVolumeClaim": {
    "icon": "kubernetes/resources/labeled/pvc.svg",
    "description": "PersistentVolumeClaim requests storage resources and uses them to mount volumes into Pods"
  },
  "ResourceQuota": {
    "icon": "kubernetes/resources/labeled/quota.svg",
    "description": "ResourceQuota limits aggregate resource consumption per namespace"
  },
  "RoleBinding": {
    "icon": "kubernetes/resources/labeled/rb.svg",
    "description": "RoleBinding grants permissions defined in a Role to users, groups, or service accounts within a namespace"
  },
  "Role": {
    "icon": "kubernetes/resources/labeled/role.svg",
    "description": "Role defines rules for a set of permissions within a specific namespace"
  },
  "ReplicaSet": {
    "icon": "kubernetes/resources/labeled/rs.svg",
    "description": "ReplicaSet maintains a stable set of replica Pods running at any given time"
  },
  "ServiceAccount": {
    "icon": "kubernetes/resources/labeled/sa.svg",
    "description": "ServiceAccount provides an identity for processes that run in a Pod"
  },
  "StorageClass": {
    "icon": "kubernetes/resources/labeled/sc.svg",
    "description": "StorageClass describes classes of storage available for PersistentVolumes"
  },
  "Scheduler": {
    "icon": "kubernetes/resources/labeled/sched.svg",
    "description": "Scheduler assigns Pods to Nodes based on resource requirements and constraints"
  },
  "Secret": {
    "icon": "kubernetes/resources/labeled/secret.svg",
    "description": "Secret stores sensitive data such as passwords, tokens, or keys, separate from application code"
  },
  "StatefulSet": {
    "icon": "kubernetes/resources/labeled/sts.svg",
    "description": "StatefulSet manages the deployment and scaling of a set of Pods with stable, unique network identifiers"
  },
  "Service": {
    "icon": "kubernetes/resources/labeled/svc.svg",
    "description": "Service exposes a network application running as one or more Pods behind a single endpoint"
  },
  "User": {
    "icon": "kubernetes/resources/labeled/user.svg",
    "description": "User represents an entity that can be authenticated and authorized to interact with the cluster"
  },
  "Volume": {
    "icon": "kubernetes/resources/labeled/vol.svg",
    "description": "Volume provides storage for containers that is more than just the ephemeral container filesystem"
  }
}
EOF

echo "kubernetes-mappings.json updated with descriptions!"
