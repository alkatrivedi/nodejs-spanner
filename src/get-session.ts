import { Database, Session, Transaction } from ".";
import { MultiplexedSession, MultiplexedSessionInterface } from "./multiplexed-session";
import { SessionPool, SessionPoolInterface, SessionPoolOptions } from "./session-pool";
import { SessionPoolConstructor } from "./database";
import { ServiceObjectConfig } from "@google-cloud/common";
const common = require('./common-grpc/service-object');

/**
 * @callback GetSessionCallback
 * @param {?Error} error Request error, if any.
 * @param {Session} session The read-write session.
 * @param {Transaction} transaction The transaction object.
 */
export interface GetSessionCallback {
    (
      err: Error | null,
      session?: Session | null,
      transaction?: Transaction | null
    ): void;
}

export interface GetSessionInterface {
    getSession(callback: GetSessionCallback): void;
    getPool(): SessionPoolInterface;
    getMultiplexedSession(): MultiplexedSessionInterface | undefined;
}

export class GetSession extends common.GrpcServiceObject implements GetSessionInterface{
    multiplexedSession_?: MultiplexedSessionInterface;
    pool_: SessionPoolInterface;
    constructor(
        database: Database,
        name: String,
        poolOptions?: SessionPoolConstructor | SessionPoolOptions,
    ) {
        super({
            parent: database,
            id: name,
        } as {} as ServiceObjectConfig);
        this.pool_ =
            typeof poolOptions === 'function'
                ? new (poolOptions as SessionPoolConstructor)(database, null)
                : new SessionPool(database, poolOptions);
        this.multiplexedSession_ = new MultiplexedSession(database);
        this.pool_.on('error', this.emit.bind(this, 'error'));
        this.pool_.open();
        // handle the error here .on event
        // should get only when environment variable is enabled
        // this.multiplexedSession_.createSession();
    }

    getSession(callback: GetSessionCallback): void {
        if(process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS==='true') {
            this.multiplexedSession_?.getSession((err, session) => {
                if(err) {
                    // fallback to regular session
                    process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
                    this.getSession(callback);
                } else {
                    callback(null, session);
                }
            });
        } else {
            this.pool_?.getSession((err, session) => {
                err ? callback(err, null) : callback(null, session);
            });
        }
    }

    getPool(): SessionPoolInterface {
        return this.pool_;
    }

    getMultiplexedSession(): MultiplexedSessionInterface | undefined {
        return this.multiplexedSession_;
    }
}