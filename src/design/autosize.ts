export default function autosize(node: HTMLElement) {
  let autosizeTm: any;

  const helper: HTMLTextAreaElement = node.cloneNode() as any;
  helper.style.position = 'absolute';
  helper.style.left = '-110%';
  helper.style.zIndex = '-1';
  helper.style.height = '0.875rem';
  document.body.appendChild(helper);

  function resize() {
    const style = getComputedStyle(node);
    helper.style.boxSizing = style.boxSizing;
    helper.style.width = `${node.clientWidth}px`;
    helper.style.fontSize = style.fontSize;
    helper.style.lineHeight = style.lineHeight;
    helper.style.padding = style.padding;
    helper.style.wordBreak = style.wordBreak;
    helper.style.whiteSpace = style.whiteSpace;
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

export function autoheight(node: HTMLElement) {
  let autosizeTm: any;

  function resize() {
    node.style.height = `${node.scrollHeight}px`;
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
      node.removeEventListener('focus', defer);
      node.removeEventListener('input', defer);
    }
  }
}
