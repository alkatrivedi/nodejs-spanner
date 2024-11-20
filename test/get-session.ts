/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {util} from '@google-cloud/common';
import * as assert from 'assert';
import * as sinon from 'sinon';
import {Spanner, Instance, Database} from '../src';
import * as gs from '../src/get-session';
import * as db from '../src/database';
import {EventEmitter} from 'events';
import * as proxyquire from 'proxyquire';
import * as extend from 'extend';
class FakeSessionPool extends EventEmitter {
    calledWith_: IArguments;
    constructor() {
      super();
      this.calledWith_ = arguments;
    }
    open() {}
    getSession() {}
    release() {}
}
class FakeMultiplexedSession extends EventEmitter {
    calledWith_: IArguments;
    constructor() {
      super();
      this.calledWith_ = arguments;
    }
    createSession() {}
    getSession() {}
}
class FakeGrpcServiceObject extends EventEmitter {
    calledWith_: IArguments;
    constructor() {
      super();
      this.calledWith_ = arguments;
    }
  }
describe('GetSession', () => {
    const sandbox = sinon.createSandbox();
    const SPANNER = {
        routeToLeaderEnabled: true,
    } as {} as Spanner;
    // let database;
    let getSession;
    // let Database: typeof db.Database;
    let GetSession: typeof gs.GetSession;
    let GetSessionCached: typeof gs.GetSession;
    const POOL_OPTIONS = {};
    const MUX_OPTIONS = {};
    const NAME = 'table-name';

    const INSTANCE = {
        request: util.noop,
        requestStream: util.noop,
        formattedName_: 'instance-name',
        databases_: new Map(),
        parent: SPANNER,
    } as {} as Instance;

    const DATABASE = {
        formattedName_: 'formatted-database-name',
        parent: INSTANCE,
      } as {} as Database;

    before(() => {
        GetSession = proxyquire('../src/get-session.js', {
            './common-grpc/service-object': {
              GrpcServiceObject: FakeGrpcServiceObject,
            },
            './session-pool': {SessionPool: FakeSessionPool},
            './multiplexed-session': {MultiplexedSession: FakeMultiplexedSession},
        }).GetSession;
        GetSessionCached = Object.assign({}, GetSession);
    });

    beforeEach(() => {
        extend(GetSession, GetSessionCached);
        getSession = new GetSession(DATABASE, NAME, POOL_OPTIONS, MUX_OPTIONS);
        getSession.parent = DATABASE;
        getSession.databaseRole = 'parent_role';
    });

    afterEach(() => sandbox.restore());

    describe('instantiation', () => {
    
        it('should create a SessionPool object', () => {
          assert(getSession.pool_ instanceof FakeSessionPool);
          assert.strictEqual(getSession.pool_.calledWith_[1], POOL_OPTIONS);
        });
    
        it('should accept a custom Pool/Multiplexed class', () => {
          function FakePool() {}
          FakePool.prototype.on = util.noop;
          FakePool.prototype.open = util.noop;

          function FakeMultiplexed() {}
          FakeMultiplexed.prototype.createSession = util.noop;
    
          const getSession = new GetSession(
            DATABASE,
            NAME,
            FakePool as {} as db.SessionPoolConstructor,
            FakeMultiplexed as {} as db.MultiplexedSessionConstructor,
          );
          assert(getSession.pool_ instanceof FakePool);
          assert(getSession.multiplexedSession_ instanceof FakeMultiplexed);
        });
    
        it('should re-emit SessionPool errors', done => {
          const error = new Error('err');
    
          getSession.on('error', err => {
            assert.strictEqual(err, error);
            done();
          });
    
          getSession.pool_.emit('error', error);
        });
    
        it('should open the pool', done => {
          FakeSessionPool.prototype.open = () => {
            FakeSessionPool.prototype.open = util.noop;
            done();
          };
    
          new GetSession(DATABASE, NAME);
        });

        it('should initiate the multiplexed session creation', done => {
            FakeMultiplexedSession.prototype.createSession = () => {
              FakeMultiplexedSession.prototype.createSession = util.noop;
              done();
            };
      
            new GetSession(DATABASE, NAME);
        });
    });

    describe('getSession', ()=>{
        it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', () => {
            process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS='true';
            sandbox.stub('')
        });

        it('should return the regular session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is not enabled', () => {
            
        });
    })
})