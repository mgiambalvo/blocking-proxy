import {BlockingProxy} from '../../lib/blockingproxy'

describe('proxy', () => {
    it('should run a basic test', () => {
        let proxy = new BlockingProxy(8111);
        expect(true);
    });
});
