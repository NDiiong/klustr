export namespace kube {
	
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
	export class PodInfo {
	    name: string;
	    namespace: string;
	    status: string;
	    ready: string;
	    restarts: number;
	    node: string;
	    podIP: string;
	    createdAt: string;
	
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

