import { expect, it } from 'vitest';
import { activeAwinJob, expiredAwinJob, githubAwinConclusion } from './awin-job-status';
it('expires only after more than sixty minutes without progress',()=>{
 const now=Date.parse('2026-11-13T06:00:00Z');
 expect(expiredAwinJob('running','2026-11-13T05:00:00Z',now)).toBe(false);
 expect(expiredAwinJob('running','2026-11-13T04:59:59Z',now)).toBe(true);
 expect(expiredAwinJob('completed','2026-11-13T04:00:00Z',now)).toBe(false);
});
it('cancelled and expired jobs never hold the active lock',()=>{
 expect(activeAwinJob('cancelled')).toBe(false);expect(activeAwinJob('expired')).toBe(false);
 expect(activeAwinJob('queued')).toBe(true);expect(activeAwinJob('running')).toBe(true);
});
it('maps GitHub cancellation and failure without pretending success completed import',()=>{
 expect(githubAwinConclusion('cancelled')).toBe('cancelled');expect(githubAwinConclusion('failure')).toBe('failed');expect(githubAwinConclusion('success')).toBeNull();
});