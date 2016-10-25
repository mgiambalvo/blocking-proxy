import {BPClient, BlockingProxy} from '../../lib/';

describe('BlockingProxy Client', () => {
  let bp: BlockingProxy;
  let client: BPClient;

  const BP_PORT = 4111;

  beforeEach(() => {
    bp = new BlockingProxy('http://localhost:3111');
    bp.listen(BP_PORT);
    client = new BPClient(`http://localhost:${BP_PORT}`);
  });

  it('should set synchronization', (done) => {
    expect(bp.stabilityEnabled).toBe(true);

    client.setSynchronization(false).then(() => {
      expect(bp.stabilityEnabled).toBe(false);
      done();
    });
  });

  xit('should set wait function arguments', (done) => {
    //client.setWaitFunction('NG_WAIT_FN', {rootElement: 'body', ng12hybrid: false});
  });

  xit('should reject invalid arguments', (done) => {
    //client.setWaitFunction('NG_WAIT_FN', {invalidArg: false});
  });

  xit('should reject missing arguments', (done) => {
    // Missing ng12hybrid
    //client.setWaitFunction('NG_WAIT_FN', {rootElement: 'body'});
  });

  xit('should allow switching the wait function', (done) => {

  });
});