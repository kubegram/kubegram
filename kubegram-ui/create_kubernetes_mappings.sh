#!/bin/bash

# Create kubernetes-mappings.json with all kubernetes icons
cd /Users/salehshehata/github.com/kubegram/kubegram/kubegram-ui/public

cat > kubernetes-mappings.json << 'EOF'
{
  "API": {
    "icon": "kubernetes/resources/labeled/api.svg",
    "description": ""
  },
  "CCM": {
    "icon": "kubernetes/resources/labeled/c-c-m.svg",
    "description": ""
  },
  "CM": {
    "icon": "kubernetes/resources/labeled/c-m.svg",
    "description": ""
  },
  "CRole": {
    "icon": "kubernetes/resources/labeled/c-role.svg",
    "description": ""
  },
  "ConfigMap": {
    "icon": "kubernetes/resources/labeled/cm.svg",
    "description": ""
  },
  "Control Plane": {
    "icon": "kubernetes/resources/labeled/control-plane.svg",
    "description": ""
  },
  "CRB": {
    "icon": "kubernetes/resources/labeled/crb.svg",
    "description": ""
  },
  "CRD": {
    "icon": "kubernetes/resources/labeled/crd.svg",
    "description": ""
  },
  "CronJob": {
    "icon": "kubernetes/resources/labeled/cronjob.svg",
    "description": ""
  },
  "Deployment": {
    "icon": "kubernetes/resources/labeled/deploy.svg",
    "description": ""
  },
  "DaemonSet": {
    "icon": "kubernetes/resources/labeled/ds.svg",
    "description": ""
  },
  "Endpoints": {
    "icon": "kubernetes/resources/labeled/ep.svg",
    "description": ""
  },
  "Etcd": {
    "icon": "kubernetes/resources/labeled/etcd.svg",
    "description": ""
  },
  "Group": {
    "icon": "kubernetes/resources/labeled/group.svg",
    "description": ""
  },
  "HPA": {
    "icon": "kubernetes/resources/labeled/hpa.svg",
    "description": ""
  },
  "Ingress": {
    "icon": "kubernetes/resources/labeled/ing.svg",
    "description": ""
  },
  "Job": {
    "icon": "kubernetes/resources/labeled/job.svg",
    "description": ""
  },
  "KProxy": {
    "icon": "kubernetes/resources/labeled/k-proxy.svg",
    "description": ""
  },
  "Kubelet": {
    "icon": "kubernetes/resources/labeled/kubelet.svg",
    "description": ""
  },
  "Limits": {
    "icon": "kubernetes/resources/labeled/limits.svg",
    "description": ""
  },
  "NetworkPolicy": {
    "icon": "kubernetes/resources/labeled/netpol.svg",
    "description": ""
  },
  "Node": {
    "icon": "kubernetes/resources/labeled/node.svg",
    "description": ""
  },
  "Namespace": {
    "icon": "kubernetes/resources/labeled/ns.svg",
    "description": ""
  },
  "Pod": {
    "icon": "kubernetes/resources/labeled/pod.svg",
    "description": ""
  },
  "PodSecurityPolicy": {
    "icon": "kubernetes/resources/labeled/psp.svg",
    "description": ""
  },
  "PersistentVolume": {
    "icon": "kubernetes/resources/labeled/pv.svg",
    "description": ""
  },
  "PersistentVolumeClaim": {
    "icon": "kubernetes/resources/labeled/pvc.svg",
    "description": ""
  },
  "ResourceQuota": {
    "icon": "kubernetes/resources/labeled/quota.svg",
    "description": ""
  },
  "RoleBinding": {
    "icon": "kubernetes/resources/labeled/rb.svg",
    "description": ""
  },
  "Role": {
    "icon": "kubernetes/resources/labeled/role.svg",
    "description": ""
  },
  "ReplicaSet": {
    "icon": "kubernetes/resources/labeled/rs.svg",
    "description": ""
  },
  "ServiceAccount": {
    "icon": "kubernetes/resources/labeled/sa.svg",
    "description": ""
  },
  "StorageClass": {
    "icon": "kubernetes/resources/labeled/sc.svg",
    "description": ""
  },
  "Scheduler": {
    "icon": "kubernetes/resources/labeled/sched.svg",
    "description": ""
  },
  "Secret": {
    "icon": "kubernetes/resources/labeled/secret.svg",
    "description": ""
  },
  "StatefulSet": {
    "icon": "kubernetes/resources/labeled/sts.svg",
    "description": ""
  },
  "Service": {
    "icon": "kubernetes/resources/labeled/svc.svg",
    "description": ""
  },
  "User": {
    "icon": "kubernetes/resources/labeled/user.svg",
    "description": ""
  },
  "Volume": {
    "icon": "kubernetes/resources/labeled/vol.svg",
    "description": ""
  }
}
EOF

echo "kubernetes-mappings.json created successfully!"
