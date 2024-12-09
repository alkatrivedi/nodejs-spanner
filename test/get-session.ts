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
import {Database, Session, SessionPool, Transaction} from '../src';
import {EventEmitter} from 'events';
import * as gs from '../src/get-session';
import * as db from '../src/database';
import * as sp from '../src/session-pool';
import * as proxyquire from 'proxyquire';
import { FakeSessionPool } from '../test/database';
import { FakeGrpcServiceObject } from '../test/database';
import { MultiplexedSession } from '../src/multiplexed-session';
import { GetSessionCallback } from '../src/get-session';
import { FakeTransaction } from './session-pool';

class FakeMultiplexedSession extends EventEmitter {
    calledWith_: IArguments;
    constructor() {
      super();
      this.calledWith_ = arguments;
    }
    createSession() {}
    getSession() {}
}

describe.only('GetSession', () => {
    const sandbox = sinon.createSandbox();

    // tslint:disable-next-line variable-name
    let GetSession: typeof gs.GetSession;

    const NAME = 'table-name';
    const POOL_OPTIONS = {};
    function noop() {}
    const DATABASE = {
        createSession: noop,
        databaseRole: 'parent_role',
    } as unknown as Database;

    let getSession;

    before(() => {
        GetSession = proxyquire('../src/get-session.js', {
            './common-grpc/service-object': {
              GrpcServiceObject: FakeGrpcServiceObject,
            },
            './session-pool': {SessionPool: FakeSessionPool},
        }).GetSession;
      });
    
    beforeEach(() => {
        getSession = new GetSession(DATABASE, NAME, POOL_OPTIONS);
        getSession.parent = DATABASE;
    });

    afterEach(() => sandbox.restore());

    describe('instantiation', () => {
    
        it('should create a SessionPool object', () => {
          assert(getSession.pool_ instanceof FakeSessionPool);
          assert.strictEqual(getSession.pool_.calledWith_[1], POOL_OPTIONS);
        });
    
        it('should accept a custom Pool class', () => {
          function FakePool() {}
          FakePool.prototype.on = util.noop;
          FakePool.prototype.open = util.noop;
    
          const getSession = new GetSession(
            DATABASE,
            NAME,
            FakePool as {} as db.SessionPoolConstructor,
          );
          assert(getSession.pool_ instanceof FakePool);
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
    
          new GetSession(DATABASE, NAME, POOL_OPTIONS);
        });

        it('should initiate the multiplexed session creation', () => {
            FakeMultiplexedSession.prototype.createSession = () => {
              FakeMultiplexedSession.prototype.createSession = util.noop;
            };
      
            new GetSession(DATABASE, NAME, POOL_OPTIONS);
        });
    });

    describe.only('getSession', ()=>{

        // let multiplexedSession;
        // let fakeMuxSession;
        // let sessionPool: sp.SessionPool;
        // // let sandbox: sinon.SinonSandbox;
        // let createSessionStub;
        // // sandbox = sinon.createSandbox();

        // const createSession = (name = 'id', props?): Session => {
        //   props = props || {multiplexed: true};
      
        //   return Object.assign(new Session(DATABASE, name), props, {
        //     create: sandbox.stub().resolves(),
        //     transaction: sandbox.stub().returns(new FakeTransaction()),
        //   });
        // };

    //     // before(() => {
    //     //     fakeMuxSession = createSession();
    //     //     // type GetSessionCallback = (err: Error | null, session: Session | null, transaction: Transaction | null) => void;
    //     //     process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'true';
    //     //     multiplexedSession = new MultiplexedSession(DATABASE);
    //     //     sessionPool = new SessionPool(DATABASE);
    //     //     sandbox.stub(multiplexedSession, 'getSession').callsFake((callback: any) => {
    //     //       callback(null, fakeMuxSession); 
    //     //     });
    //     //     createSessionStub = sandbox
    //     //     .stub(DATABASE, 'createSession')
    //     //     .withArgs({multiplexed: true})
    //     //     .callsFake(() => {
    //     //       return Promise.resolve([fakeMuxSession]);
    //     //     });
    //     // });

    //     // afterEach(() => {
    //     //     process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = 'false';
    //     //     sandbox.restore();
    //     // });

        it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', async () => {
            assert.strictEqual(process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS, 'true');
            getSession.getSession((err, resp) => {
                console.log(resp);
            });
        });

    //     // it('should return the multiplexed session if GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS env is enabled', () => {
    //     //     assert(multiplexedSession instanceof Session); 
    //     //     sandbox.stub(sessionPool, 'getSession').callsFake((callback: GetSessionCallback) => {
    //     //         callback(null, fakeSession); 
    //     //     });
    //     // });

    });
});