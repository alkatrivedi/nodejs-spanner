import {Database} from './database';
import {Session} from './session';
import {Transaction} from './transaction';

interface MultiplexedSessionInventory {
    multiplexedSession: Set<Session>;
}

export interface GetSessionCallback {
    (
      err: Error | null,
      session?: Session | null,
      transaction?: Transaction | null
    ): void;
}

export interface MultiplexedSessionInterface {
    createMultiplexedSession(): Promise<void>;
    getMultiplexedSession(callback: GetSessionCallback): void;
}

export interface MultiplexedSessionOptions {
    keepAlive?: number;
    databaseRole?: string | null;
    idlesAfter?: number;
}
  
const MULTIPLEXEDSESSIONDEFAULTS: MultiplexedSessionOptions = {
    keepAlive: 30,
    databaseRole: null,
    idlesAfter: 10,
};

export class MultiplexedSession {
    database: Database;
    multiplexedSessionOptions: MultiplexedSessionOptions;
    _multiplexedInventory!: MultiplexedSessionInventory;
    _pingHandle!: NodeJS.Timer;
    constructor(database: Database, multiplexedSessionOptions?: MultiplexedSessionOptions) {
        this.database = database;
        this.multiplexedSessionOptions = Object.assign({}, MULTIPLEXEDSESSIONDEFAULTS, multiplexedSessionOptions);
        this._multiplexedInventory = {
            multiplexedSession: new Set(),
        };
    }

    /*New
    **/
    async createMultiplexedSession(): Promise<void> {
        this._startHouseKeeping();
        await this._createMultiplexedSessions();
    }

    _startHouseKeeping(): void {
        const pingRate = this.multiplexedSessionOptions.keepAlive! * 60000;
        this._pingHandle = setInterval(() => this._pingMultiplexedSession(), pingRate);
        this._pingHandle.unref();
    }

    /**
     * Makes a keep alive request to all the idle sessions.
     *
     * @private
     *
     * @returns {Promise}
     */
    async _pingMultiplexedSession(): Promise<void> {
        this.getMultiplexedSession(async (err, session)=>{
            await this._ping(session!);
        });
        await this.createMultiplexedSession();
    }

    /**
     * Pings an individual session.
     *
     * @private
     *
     * @param {Session} session The session to ping.
     * @returns {Promise}
     */
    async _ping(session: Session): Promise<void> {
        await session.keepAlive();
    }

    /**
     * Retrieve a multiplexed session.
     *
     * @param {GetSessionCallback} callback The callback function.
    */
    getMultiplexedSession(callback: GetSessionCallback): void {
        this._acquireMultiplexedSession().then(
            session => callback(null, session, session.txn!),
        );
    }

    async _acquireMultiplexedSession(): Promise<Session> {
        const session = await this._getMultiplexedSession();
        return session;
    }

    _borrowMultiplexedSession(multiplexedSession: Session): void {
        // const length = this._multiplexedInventory.multiplexedSession.size;
        // const session = this._multiplexedInventory.multiplexedSession[0];
        this._multiplexedInventory.multiplexedSession.add(multiplexedSession);
        // return session;
    }

    _borrowFromMultiplexed(): Session {
        // const session = this._multiplexedInventory.multiplexedSession[0];
        const [session] = [...this._multiplexedInventory.multiplexedSession];
        return session;
    }

    _borrowAvailableMultiplexedSession(): Session {
        return this._borrowFromMultiplexed();
    }

    async _createMultiplexedSessions(): Promise<void> {
        if (!this._hasMultiplexedSessionUsableFor()) {
            // const session: Session = await this.database.createMultiplexedSession();
            // this._multiplexedInventory.multiplexedSession.push(session);
            const createSessionResponse = await this.database.createMultiplexedSession();
        
            // If CreateSessionResponse is actually a Session or contains a Session, you can cast it
            const session = createSessionResponse as unknown as Session;
            this._multiplexedInventory.multiplexedSession.add(session);
        }
        return ;
    }

    _hasMultiplexedSessionUsableFor(): boolean {
        return this._multiplexedInventory.multiplexedSession.size > 0;
    }

    async _getMultiplexedSession(): Promise<Session> {
        if (this._hasMultiplexedSessionUsableFor()) {
          return this._borrowAvailableMultiplexedSession();
        }
        // const session = await this.database.createMultiplexedSession();
        const createSessionResponse = await this.database.createMultiplexedSession();
        // const session = createSessionResponse as unknown as Session;
        this._multiplexedInventory.multiplexedSession.add(createSessionResponse[0]);
        return this._borrowAvailableMultiplexedSession();
    }
}