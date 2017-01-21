import {BlockingProxy, BPClient} from '../../lib/';

describe('BlockingProxy Client', () => {
  let bp: BlockingProxy;
  let client: BPClient;

  const BP_PORT = 4111;

  beforeAll(() => {
    bp = new BlockingProxy('http://localhost:3111');
    bp.listen(BP_PORT);
    client = new BPClient(`http://localhost:${BP_PORT}`);
  });

  it('should toggle waiting', async() => {
    expect(bp.waitEnabled).toBe(true);

    await client.setWaitEnabled(false);
    expect(bp.waitEnabled).toBe(false);
  });

  it('allows changing the root selector', () => {
    bp.rootSelector= '';
    const newRoot = 'div#app';

    //await client.setWaitParams(newRoot);
    //expect(bp.rootSelector).toBe(newRoot);
  });
});

