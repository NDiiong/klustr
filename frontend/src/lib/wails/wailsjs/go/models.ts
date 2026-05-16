export namespace kube {
	
	export class ConditionDetail {
	    type: string;
	    status: string;
	    reason: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ConditionDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.status = source["status"];
	        this.reason = source["reason"];
	        this.message = source["message"];
	    }
	}
	export class ConfigMapDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    data: Record<string, string>;
	    binaryKeys: string[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ConfigMapDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.data = source["data"];
	        this.binaryKeys = source["binaryKeys"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class ConfigMapInfo {
	    name: string;
	    namespace: string;
	    keys: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ConfigMapInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.keys = source["keys"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class ContainerPort {
	    name: string;
	    containerPort: number;
	    protocol: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerPort(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.containerPort = source["containerPort"];
	        this.protocol = source["protocol"];
	    }
	}
	export class ContainerDetail {
	    name: string;
	    image: string;
	    state: string;
	    stateReason: string;
	    ready: boolean;
	    restartCount: number;
	    startedAt: string;
	    lastState: string;
	    ports: ContainerPort[];
	
	    static createFrom(source: any = {}) {
	        return new ContainerDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.image = source["image"];
	        this.state = source["state"];
	        this.stateReason = source["stateReason"];
	        this.ready = source["ready"];
	        this.restartCount = source["restartCount"];
	        this.startedAt = source["startedAt"];
	        this.lastState = source["lastState"];
	        this.ports = this.convertValues(source["ports"], ContainerPort);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ContainerSummary {
	    name: string;
	    image: string;
	    ports: string[];
	    command: string[];
	    args: string[];
	    envCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ContainerSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.image = source["image"];
	        this.ports = source["ports"];
	        this.command = source["command"];
	        this.args = source["args"];
	        this.envCount = source["envCount"];
	    }
	}
	export class ContextInfo {
	    name: string;
	    cluster: string;
	    server: string;
	    user: string;
	    namespace: string;
	
	    static createFrom(source: any = {}) {
	        return new ContextInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.cluster = source["cluster"];
	        this.server = source["server"];
	        this.user = source["user"];
	        this.namespace = source["namespace"];
	    }
	}
	export class CronJobDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    schedule: string;
	    timeZone: string;
	    suspend: boolean;
	    concurrencyPolicy: string;
	    startingDeadlineSeconds: number;
	    successfulJobsHistoryLimit: number;
	    failedJobsHistoryLimit: number;
	    active: number;
	    lastSchedule: string;
	    containers: ContainerSummary[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CronJobDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.schedule = source["schedule"];
	        this.timeZone = source["timeZone"];
	        this.suspend = source["suspend"];
	        this.concurrencyPolicy = source["concurrencyPolicy"];
	        this.startingDeadlineSeconds = source["startingDeadlineSeconds"];
	        this.successfulJobsHistoryLimit = source["successfulJobsHistoryLimit"];
	        this.failedJobsHistoryLimit = source["failedJobsHistoryLimit"];
	        this.active = source["active"];
	        this.lastSchedule = source["lastSchedule"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CronJobInfo {
	    name: string;
	    namespace: string;
	    schedule: string;
	    suspend: boolean;
	    active: number;
	    lastSchedule: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CronJobInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.schedule = source["schedule"];
	        this.suspend = source["suspend"];
	        this.active = source["active"];
	        this.lastSchedule = source["lastSchedule"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class DaemonSetDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    desired: number;
	    current: number;
	    ready: number;
	    upToDate: number;
	    available: number;
	    misscheduled: number;
	    nodeSelector: Record<string, string>;
	    updateStrategy: string;
	    selector: Record<string, string>;
	    containers: ContainerSummary[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DaemonSetDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.desired = source["desired"];
	        this.current = source["current"];
	        this.ready = source["ready"];
	        this.upToDate = source["upToDate"];
	        this.available = source["available"];
	        this.misscheduled = source["misscheduled"];
	        this.nodeSelector = source["nodeSelector"];
	        this.updateStrategy = source["updateStrategy"];
	        this.selector = source["selector"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DaemonSetInfo {
	    name: string;
	    namespace: string;
	    desired: number;
	    current: number;
	    ready: number;
	    upToDate: number;
	    available: number;
	    nodeSelector: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DaemonSetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.desired = source["desired"];
	        this.current = source["current"];
	        this.ready = source["ready"];
	        this.upToDate = source["upToDate"];
	        this.available = source["available"];
	        this.nodeSelector = source["nodeSelector"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class DeploymentDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    strategy: string;
	    replicas: number;
	    ready: number;
	    updated: number;
	    available: number;
	    unavailable: number;
	    selector: Record<string, string>;
	    containers: ContainerSummary[];
	    conditions: ConditionDetail[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DeploymentDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.strategy = source["strategy"];
	        this.replicas = source["replicas"];
	        this.ready = source["ready"];
	        this.updated = source["updated"];
	        this.available = source["available"];
	        this.unavailable = source["unavailable"];
	        this.selector = source["selector"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.conditions = this.convertValues(source["conditions"], ConditionDetail);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DeploymentInfo {
	    name: string;
	    namespace: string;
	    ready: string;
	    upToDate: number;
	    available: number;
	    strategy: string;
	    images: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new DeploymentInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.ready = source["ready"];
	        this.upToDate = source["upToDate"];
	        this.available = source["available"];
	        this.strategy = source["strategy"];
	        this.images = source["images"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class EventInfo {
	    namespace: string;
	    name: string;
	    type: string;
	    reason: string;
	    message: string;
	    count: number;
	    source: string;
	    // Go type: time
	    firstSeen: any;
	    // Go type: time
	    lastSeen: any;
	    objectKind: string;
	    objectName: string;
	
	    static createFrom(source: any = {}) {
	        return new EventInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.namespace = source["namespace"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.reason = source["reason"];
	        this.message = source["message"];
	        this.count = source["count"];
	        this.source = source["source"];
	        this.firstSeen = this.convertValues(source["firstSeen"], null);
	        this.lastSeen = this.convertValues(source["lastSeen"], null);
	        this.objectKind = source["objectKind"];
	        this.objectName = source["objectName"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class IngressTLSDetail {
	    hosts: string[];
	    secretName: string;
	
	    static createFrom(source: any = {}) {
	        return new IngressTLSDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hosts = source["hosts"];
	        this.secretName = source["secretName"];
	    }
	}
	export class IngressPathDetail {
	    path: string;
	    pathType: string;
	    serviceName: string;
	    servicePort: string;
	
	    static createFrom(source: any = {}) {
	        return new IngressPathDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.pathType = source["pathType"];
	        this.serviceName = source["serviceName"];
	        this.servicePort = source["servicePort"];
	    }
	}
	export class IngressRuleDetail {
	    host: string;
	    paths: IngressPathDetail[];
	
	    static createFrom(source: any = {}) {
	        return new IngressRuleDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.paths = this.convertValues(source["paths"], IngressPathDetail);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class IngressDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    class: string;
	    rules: IngressRuleDetail[];
	    tls: IngressTLSDetail[];
	    addresses: string[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new IngressDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.class = source["class"];
	        this.rules = this.convertValues(source["rules"], IngressRuleDetail);
	        this.tls = this.convertValues(source["tls"], IngressTLSDetail);
	        this.addresses = source["addresses"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class IngressInfo {
	    name: string;
	    namespace: string;
	    class: string;
	    hosts: string;
	    address: string;
	    ports: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new IngressInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.class = source["class"];
	        this.hosts = source["hosts"];
	        this.address = source["address"];
	        this.ports = source["ports"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	
	
	export class JobDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    completions: string;
	    parallelism: number;
	    backoffLimit: number;
	    active: number;
	    succeeded: number;
	    failed: number;
	    startTime: string;
	    completionTime: string;
	    duration: string;
	    status: string;
	    containers: ContainerSummary[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new JobDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.completions = source["completions"];
	        this.parallelism = source["parallelism"];
	        this.backoffLimit = source["backoffLimit"];
	        this.active = source["active"];
	        this.succeeded = source["succeeded"];
	        this.failed = source["failed"];
	        this.startTime = source["startTime"];
	        this.completionTime = source["completionTime"];
	        this.duration = source["duration"];
	        this.status = source["status"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class JobInfo {
	    name: string;
	    namespace: string;
	    completions: string;
	    duration: string;
	    status: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new JobInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.completions = source["completions"];
	        this.duration = source["duration"];
	        this.status = source["status"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class Kubeconfig {
	    contexts: ContextInfo[];
	    currentContext: string;
	
	    static createFrom(source: any = {}) {
	        return new Kubeconfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.contexts = this.convertValues(source["contexts"], ContextInfo);
	        this.currentContext = source["currentContext"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NamespaceDetail {
	    name: string;
	    uid: string;
	    phase: string;
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new NamespaceDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.uid = source["uid"];
	        this.phase = source["phase"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class NamespaceInfo {
	    name: string;
	    phase: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new NamespaceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.phase = source["phase"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class NodeTaintDetail {
	    key: string;
	    value: string;
	    effect: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeTaintDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	        this.effect = source["effect"];
	    }
	}
	export class NodeDetail {
	    name: string;
	    uid: string;
	    status: string;
	    roles: string;
	    version: string;
	    osImage: string;
	    kernelVersion: string;
	    containerRuntime: string;
	    architecture: string;
	    internalIP: string;
	    hostname: string;
	    capacity: Record<string, string>;
	    allocatable: Record<string, string>;
	    taints: NodeTaintDetail[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    conditions: ConditionDetail[];
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.uid = source["uid"];
	        this.status = source["status"];
	        this.roles = source["roles"];
	        this.version = source["version"];
	        this.osImage = source["osImage"];
	        this.kernelVersion = source["kernelVersion"];
	        this.containerRuntime = source["containerRuntime"];
	        this.architecture = source["architecture"];
	        this.internalIP = source["internalIP"];
	        this.hostname = source["hostname"];
	        this.capacity = source["capacity"];
	        this.allocatable = source["allocatable"];
	        this.taints = this.convertValues(source["taints"], NodeTaintDetail);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.conditions = this.convertValues(source["conditions"], ConditionDetail);
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeInfo {
	    name: string;
	    status: string;
	    roles: string;
	    version: string;
	    osImage: string;
	    internalIP: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new NodeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.status = source["status"];
	        this.roles = source["roles"];
	        this.version = source["version"];
	        this.osImage = source["osImage"];
	        this.internalIP = source["internalIP"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	export class OwnerRef {
	    kind: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new OwnerRef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kind = source["kind"];
	        this.name = source["name"];
	    }
	}
	export class PersistentVolumeClaimDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    status: string;
	    volume: string;
	    storageClass: string;
	    volumeMode: string;
	    accessModes: string[];
	    capacity: string;
	    request: string;
	    selector: Record<string, string>;
	    conditions: ConditionDetail[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new PersistentVolumeClaimDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.status = source["status"];
	        this.volume = source["volume"];
	        this.storageClass = source["storageClass"];
	        this.volumeMode = source["volumeMode"];
	        this.accessModes = source["accessModes"];
	        this.capacity = source["capacity"];
	        this.request = source["request"];
	        this.selector = source["selector"];
	        this.conditions = this.convertValues(source["conditions"], ConditionDetail);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PersistentVolumeClaimInfo {
	    name: string;
	    namespace: string;
	    status: string;
	    volume: string;
	    capacity: string;
	    accessModes: string;
	    storageClass: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new PersistentVolumeClaimInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.status = source["status"];
	        this.volume = source["volume"];
	        this.capacity = source["capacity"];
	        this.accessModes = source["accessModes"];
	        this.storageClass = source["storageClass"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class PersistentVolumeDetail {
	    name: string;
	    uid: string;
	    status: string;
	    capacity: string;
	    accessModes: string[];
	    reclaimPolicy: string;
	    storageClass: string;
	    volumeMode: string;
	    claim: string;
	    source: string;
	    message: string;
	    reason: string;
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new PersistentVolumeDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.uid = source["uid"];
	        this.status = source["status"];
	        this.capacity = source["capacity"];
	        this.accessModes = source["accessModes"];
	        this.reclaimPolicy = source["reclaimPolicy"];
	        this.storageClass = source["storageClass"];
	        this.volumeMode = source["volumeMode"];
	        this.claim = source["claim"];
	        this.source = source["source"];
	        this.message = source["message"];
	        this.reason = source["reason"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class PersistentVolumeInfo {
	    name: string;
	    capacity: string;
	    accessModes: string;
	    reclaimPolicy: string;
	    status: string;
	    claim: string;
	    storageClass: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new PersistentVolumeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.capacity = source["capacity"];
	        this.accessModes = source["accessModes"];
	        this.reclaimPolicy = source["reclaimPolicy"];
	        this.status = source["status"];
	        this.claim = source["claim"];
	        this.storageClass = source["storageClass"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class PodDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    status: string;
	    phase: string;
	    node: string;
	    podIP: string;
	    hostIP: string;
	    qosClass: string;
	    serviceAccount: string;
	    restartPolicy: string;
	    priorityClassName: string;
	    createdAt: string;
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    owners: OwnerRef[];
	    initContainers: ContainerDetail[];
	    containers: ContainerDetail[];
	    conditions: ConditionDetail[];
	
	    static createFrom(source: any = {}) {
	        return new PodDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.status = source["status"];
	        this.phase = source["phase"];
	        this.node = source["node"];
	        this.podIP = source["podIP"];
	        this.hostIP = source["hostIP"];
	        this.qosClass = source["qosClass"];
	        this.serviceAccount = source["serviceAccount"];
	        this.restartPolicy = source["restartPolicy"];
	        this.priorityClassName = source["priorityClassName"];
	        this.createdAt = source["createdAt"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.owners = this.convertValues(source["owners"], OwnerRef);
	        this.initContainers = this.convertValues(source["initContainers"], ContainerDetail);
	        this.containers = this.convertValues(source["containers"], ContainerDetail);
	        this.conditions = this.convertValues(source["conditions"], ConditionDetail);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PodInfo {
	    name: string;
	    namespace: string;
	    status: string;
	    ready: string;
	    restarts: number;
	    node: string;
	    podIP: string;
	    createdAt: string;
	    cpuRequestMC: number;
	    cpuLimitMC: number;
	    memRequestB: number;
	    memLimitB: number;
	
	    static createFrom(source: any = {}) {
	        return new PodInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.status = source["status"];
	        this.ready = source["ready"];
	        this.restarts = source["restarts"];
	        this.node = source["node"];
	        this.podIP = source["podIP"];
	        this.createdAt = source["createdAt"];
	        this.cpuRequestMC = source["cpuRequestMC"];
	        this.cpuLimitMC = source["cpuLimitMC"];
	        this.memRequestB = source["memRequestB"];
	        this.memLimitB = source["memLimitB"];
	    }
	}
	export class PodLogTarget {
	    pod: string;
	    containers: string[];
	
	    static createFrom(source: any = {}) {
	        return new PodLogTarget(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pod = source["pod"];
	        this.containers = source["containers"];
	    }
	}
	export class PodMetrics {
	    namespace: string;
	    name: string;
	    cpuMC: number;
	    memB: number;
	
	    static createFrom(source: any = {}) {
	        return new PodMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.namespace = source["namespace"];
	        this.name = source["name"];
	        this.cpuMC = source["cpuMC"];
	        this.memB = source["memB"];
	    }
	}
	export class PortForwardInfo {
	    id: string;
	    context: string;
	    namespace: string;
	    podName: string;
	    localPort: number;
	    remotePort: number;
	    status: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new PortForwardInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.context = source["context"];
	        this.namespace = source["namespace"];
	        this.podName = source["podName"];
	        this.localPort = source["localPort"];
	        this.remotePort = source["remotePort"];
	        this.status = source["status"];
	        this.error = source["error"];
	    }
	}
	export class ReplicaSetDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    desired: number;
	    current: number;
	    ready: number;
	    available: number;
	    owners: OwnerRef[];
	    selector: Record<string, string>;
	    containers: ContainerSummary[];
	    conditions: ConditionDetail[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ReplicaSetDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.desired = source["desired"];
	        this.current = source["current"];
	        this.ready = source["ready"];
	        this.available = source["available"];
	        this.owners = this.convertValues(source["owners"], OwnerRef);
	        this.selector = source["selector"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.conditions = this.convertValues(source["conditions"], ConditionDetail);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReplicaSetInfo {
	    name: string;
	    namespace: string;
	    desired: number;
	    current: number;
	    ready: number;
	    ownedBy: string;
	    images: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ReplicaSetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.desired = source["desired"];
	        this.current = source["current"];
	        this.ready = source["ready"];
	        this.ownedBy = source["ownedBy"];
	        this.images = source["images"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class SecretKeyInfo {
	    key: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new SecretKeyInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.size = source["size"];
	    }
	}
	export class SecretDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    type: string;
	    keys: SecretKeyInfo[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SecretDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.type = source["type"];
	        this.keys = this.convertValues(source["keys"], SecretKeyInfo);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SecretInfo {
	    name: string;
	    namespace: string;
	    type: string;
	    keys: number;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SecretInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.type = source["type"];
	        this.keys = source["keys"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	export class ServerVersion {
	    gitVersion: string;
	    platform: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.gitVersion = source["gitVersion"];
	        this.platform = source["platform"];
	    }
	}
	export class ServicePortDetail {
	    name: string;
	    protocol: string;
	    port: number;
	    targetPort: string;
	    nodePort: number;
	
	    static createFrom(source: any = {}) {
	        return new ServicePortDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.protocol = source["protocol"];
	        this.port = source["port"];
	        this.targetPort = source["targetPort"];
	        this.nodePort = source["nodePort"];
	    }
	}
	export class ServiceDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    type: string;
	    clusterIPs: string[];
	    externalIPs: string[];
	    selector: Record<string, string>;
	    ports: ServicePortDetail[];
	    sessionAffinity: string;
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ServiceDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.type = source["type"];
	        this.clusterIPs = source["clusterIPs"];
	        this.externalIPs = source["externalIPs"];
	        this.selector = source["selector"];
	        this.ports = this.convertValues(source["ports"], ServicePortDetail);
	        this.sessionAffinity = source["sessionAffinity"];
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ServiceInfo {
	    name: string;
	    namespace: string;
	    type: string;
	    clusterIP: string;
	    externalIP: string;
	    ports: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ServiceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.type = source["type"];
	        this.clusterIP = source["clusterIP"];
	        this.externalIP = source["externalIP"];
	        this.ports = source["ports"];
	        this.createdAt = source["createdAt"];
	    }
	}
	
	export class StatefulSetDetail {
	    name: string;
	    namespace: string;
	    uid: string;
	    replicas: number;
	    ready: number;
	    service: string;
	    updateStrategy: string;
	    podManagementPolicy: string;
	    selector: Record<string, string>;
	    containers: ContainerSummary[];
	    labels: Record<string, string>;
	    annotations: Record<string, string>;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new StatefulSetDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.uid = source["uid"];
	        this.replicas = source["replicas"];
	        this.ready = source["ready"];
	        this.service = source["service"];
	        this.updateStrategy = source["updateStrategy"];
	        this.podManagementPolicy = source["podManagementPolicy"];
	        this.selector = source["selector"];
	        this.containers = this.convertValues(source["containers"], ContainerSummary);
	        this.labels = source["labels"];
	        this.annotations = source["annotations"];
	        this.createdAt = source["createdAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StatefulSetInfo {
	    name: string;
	    namespace: string;
	    ready: string;
	    service: string;
	    images: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new StatefulSetInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.namespace = source["namespace"];
	        this.ready = source["ready"];
	        this.service = source["service"];
	        this.images = source["images"];
	        this.createdAt = source["createdAt"];
	    }
	}

}

