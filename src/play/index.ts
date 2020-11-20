import { Delimited, Page, DataSet, PageSizes, } from 'raport/index';
import { ReportDesigner, } from 'design/index';
import Ractive, { InitOpts } from 'ractive';

class App extends Ractive {
  delimited: Delimited;
  paged: Page;

  constructor(opts?: InitOpts) {
    super(opts);
  }
}
Ractive.extendWith(App, {
  template: '#template',
  data() {
    return {
      sources: [{ name: 'people', values() { return Promise.resolve(people()); } }],
    }
  },
  components: {
    report: ReportDesigner,
  },
  on: {
    'report.init'(ctx) {
      globalThis.cmp = ctx.component;
    }
  }
});

const app = globalThis.app = new App({
  target: 'body',
});

// delimtied example
app.delimited = {
  type: 'delimited',
  headers: [':Name', ':Age', ':Money', ":Things", "'Sum Things'", "'Average Things'"],
  sources: [{ source: 'people' }],
  source: 'people',
  quote: '"',
  fields: [
    'name', 'age', "'$$ ${(format wallet)}'", `(count +things)`, `(sum +things)`, `(format (avg +things) 'integer')`
  ]
};

// Page displayed example - try a Flow report
app.paged = {
  type: 'page',
  classifyStyles: true,
  footer: { type: 'container', widgets: [
    { type: 'label', width: { percent: 100 }, font: { align: 'right' }, text: "'Page ${@page} of ${@pages}'" }
  ] },
  size: PageSizes.letter,
  orientation: 'landscape',
  sources: [{ source: 'people', sort: `[{ :by: :name :desc: !desc }]`, group: ['name.0'] }],
  parameters: [
    { name: 'desc', type: 'boolean' }
  ],
  widgets: [
    { type: 'container', widgets: [
      { type: 'label', height: 2, width: { percent: 100 }, font: { size: 2, align: 'center' }, text: `'People Report'` },
      { type: 'label', height: 1, width: { percent: 100 }, font: { align: 'center', weight: 700 }, text: `(format @date 'date')` },
      { type: 'html', html: "'<strong>Some HTML For ${(count +people)} People</strong><table><tr><th /><th>head</th></tr><tr><th>row1</th><td>body1</td></tr><tr><th>row2</th><td>body2</td></tr></table>'", height: 6 },
    ] },
    { type: 'repeater', source: { source: 'people' },
      group: [
        { type: 'container', widgets: [
          { type: 'label', margin: [1, 0, 0, 0], height: 1.5, width: 10, font: { size: 1.5, weight: 700 }, text: 'group' }
        ], layout: [ [5, 0] ] }
      ],
      groupEnds: [true, true],
      header: { type: 'container', font: { weight: 700 }, border: 2, margin: 0.25, widgets: [
        { type: 'label', width: 10, text: `'Name'` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `'Age'` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `'Money'` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `'Things'` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `'Sum Things'` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `'Average Things'` },
      ] },
      row: { type: 'container', border: 1, margin: 0.25, widgets: [
        { type: 'label', width: 10, text: 'name' },
        { type: 'label', width: 10, font: { align: 'right' }, text: '(format age :integer)' },
        { type: 'label', width: 10, font: { align: 'right' }, text: "'$ ${(format wallet :number)}'" },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(count +things)` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(sum +things)` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(format (avg +things) :integer)` },
      ] },
      footer: { type: 'container', border: `(if group {:top: 1} 0)`, margin: 0.25, widgets: [
        { type: 'container', width: { percent: 100 }, hide: 'group', margin: [4, 0, 0, 0], border: 1, widgets: [
          { type: 'label', width: 10, height: 1.5, font: { size: 1.5, weight: 700 }, text: `'Totals:'` }
        ], layout: [
          [ 5, 0 ]
        ] },
        { type: 'label', width: 10 },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(format (avg =>age) :integer)` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(+ '$ ' (format (sum =>wallet) :number))` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(sum =>(count +things))` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(sum =>(sum +things))` },
        { type: 'label', width: 10, font: { align: 'right' }, text: `(format (avg =>(avg +things)) :integer)` },
      ] }
    }
  ]
};

function people(): DataSet {
  return {
    value: [
      { name: 'Joe', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Alfred', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Susan', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Anders', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'George', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Amber', age: 36, wallet: 882.33, things: [12] },
      { name: 'Fred', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Aquafina', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Aaron', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Frank', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Karen', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Peter', age: 36, wallet: 882.33, things: [12] },
      { name: 'Paul', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Mary', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Ringo', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Yoko', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Jim', age: 36, wallet: 882.33, things: [12] },
      { name: 'James', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Jimmy', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Jimmie', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Jamey', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Jamie', age: 36, wallet: 882.33, things: [12] },
      { name: 'Jack', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Jackson', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Frederick', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Francis', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Antiope', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Cody', age: 36, wallet: 882.33, things: [12] },
      { name: 'Kody', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Kobe', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Ada', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Zara', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Alex', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Tycho', age: 36, wallet: 882.33, things: [12] },
      { name: 'Irisa', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Arissa', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Alyssa', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Sharon', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Charon', age: 36, wallet: 882.33, things: [12] },
      { name: 'Candy', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Kandy', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Appalachia', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Apex', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Candie', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Kandie', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Kimberly', age: 36, wallet: 882.33, things: [12] },
      { name: 'Lustre', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Justice', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Alec', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Landry', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Tessa', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Kris', age: 36, wallet: 882.33, things: [12] },
      { name: 'Amplitude', age: 36, wallet: 882.33, things: [12] },
      { name: 'Alan', age: 12, wallet: 99182.33, things: [4, 881, 251] },
      { name: 'Alanna', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Lanna', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Rose', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Amythest', age: 36, wallet: 882.33, things: [12] },
      { name: 'Petunia', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Daisy', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Peach', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Apple', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Amanda', age: 36, wallet: 882.33, things: [12] },
      { name: 'Mandy', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Jenna', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Jennfer', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Josie', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Zeus', age: 3999, wallet: 29291.1234, things: [1, 3, 5, 7, 9, 11, 13, 17, 19, 23, 31] },
      { name: 'Joe', age: 36, wallet: 882.33, things: [12] },
      { name: 'Joseph', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Jerry', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Jeffery', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Geoffery', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Gilbert', age: 36, wallet: 882.33, things: [12] },
      { name: 'Axon', age: 36, wallet: 882.33, things: [12] },
      { name: 'Grady', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Gerald', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Genny', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Gertrude', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Gabby', age: 36, wallet: 882.33, things: [12] },
      { name: 'Gabe', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Gabriel', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Gabriella', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Pax', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Pansy', age: 36, wallet: 882.33, things: [12] },
      { name: 'Penelope', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Tulip', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Hyacinth', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Craig', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Axel', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Greg', age: 36, wallet: 882.33, things: [12] },
      { name: 'Gregory', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Grigory', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Gale', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Gail', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Abby', age: 36, wallet: 882.33, things: [12] },
      { name: 'Abigail', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Abygale', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Abygail', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Abigale', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Bartholomew', age: 36, wallet: 882.33, things: [12] },
      { name: 'Bart', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Lisa', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Lissa', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Steve', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Steven', age: 36, wallet: 882.33, things: [12] },
      { name: 'Stephen', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Stephanie', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Tiffany', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Terry', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Perry', age: 36, wallet: 882.33, things: [12] },
      { name: 'Percival', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Poppy', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Pria', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Hvita', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Hetta', age: 36, wallet: 882.33, things: [12] },
      { name: 'Hapi', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Hester', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Hestia', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Hera', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Jose', age: 36, wallet: 882.33, things: [12] },
      { name: 'Esther', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Ruth', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Henry', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Hank', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Harry', age: 36, wallet: 882.33, things: [12] },
      { name: 'Harold', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Harper', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Melany', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Melody', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Manny', age: 36, wallet: 882.33, things: [12] },
      { name: 'Ray', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Raymond', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Rasmus', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Ronald', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Ronoldo', age: 36, wallet: 882.33, things: [12] },
      { name: 'Ronda', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Ralph', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Michael', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Michel', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Michaela', age: 36, wallet: 882.33, things: [12] },
      { name: 'Mike', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Mephisto', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Al', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Alan', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Allen', age: 36, wallet: 882.33, things: [12] },
      { name: 'Abel', age: 12, wallet: 99182.33, things: [4, 881] },
      { name: 'Cain', age: 22, wallet: 27.75, things: [1, 2, 5] },
      { name: 'Christy', age: 69, wallet: 1182.43, things: [5, 3, 1] },
      { name: 'Christine', age: 42, wallet: 225.32, things: [18, 4, 22] },
      { name: 'Caroline', age: 36, wallet: 882.33, things: [12] },
      { name: 'Corrina', age: 12, wallet: 99182.33, things: [4, 881] },
    ]
  }
}
