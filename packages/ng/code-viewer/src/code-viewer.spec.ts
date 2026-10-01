import { TestBed } from '@angular/core/testing';
import { MpCodeViewer } from './code-viewer';

describe('MpCodeViewer', () => {
  it('shows the value read-only, objects as indented JSON, and follows new values', async () => {
    const fixture = TestBed.createComponent(MpCodeViewer);
    fixture.componentRef.setInput('value', { kind: 'Server', spec: { replicas: 2 } });
    await fixture.whenStable();
    const viewer = fixture.componentInstance;
    expect(viewer.editor?.state.doc.toString()).toBe('{\n  "kind": "Server",\n  "spec": {\n    "replicas": 2\n  }\n}');
    expect(viewer.editor?.state.readOnly).toBe(true);
    fixture.componentRef.setInput('value', 'kind: Server\n');
    fixture.componentRef.setInput('language', 'yaml');
    await fixture.whenStable();
    expect(viewer.editor?.state.doc.toString()).toBe('kind: Server\n');
    expect(fixture.nativeElement.querySelector('.cm-content')?.getAttribute('aria-label')).toBe('json document');
  });
});
