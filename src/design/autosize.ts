export default function autosize(node: HTMLElement) {
  let autosizeTm: any;

  const helper: HTMLTextAreaElement = node.cloneNode() as any;
  helper.style.position = 'absolute';
  helper.style.left = '-110%';
  helper.style.zIndex = '-1';
  helper.style.height = '14px';
  helper.style.fontSize = '14px';
  helper.style.lineHeight = '14px';
  helper.style.padding = '14px';
  helper.style.wordBreak = 'break-all';
  helper.style.whiteSpace = 'pre-wrap';
  document.body.appendChild(helper);

  function resize() {
    const style = getComputedStyle(node);
    helper.style.boxSizing = style.boxSizing;
    helper.style.width = `${node.clientWidth}px`;
    helper.value = (node as HTMLTextAreaElement).value;
    node.style.height = `${helper.scrollHeight + 8}px`;
  }

  function defer() {
    if (autosizeTm) clearTimeout(autosizeTm);
    setTimeout(resize, 500);
  }

  node.addEventListener('focus', defer);
  node.addEventListener('input', defer);
  node.style.overflow = 'hidden';

  return {
    teardown() {
      helper.remove();
      node.removeEventListener('focus', defer);
      node.removeEventListener('input', defer);
    }
  }
}
