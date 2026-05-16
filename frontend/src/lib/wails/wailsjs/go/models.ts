export namespace kube {
	
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

}

