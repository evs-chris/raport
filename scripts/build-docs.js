const doc_strs = Raport.Design.docs;
const docs = ['operators', 'formats'].reduce((a, c) => (a[c] = Raport.evaluate(doc_strs[c]), a), {});
console.log(Raport.evaluate(docs, doc_strs.generateMarkdown));
