set -e
# hide the commonjs things to force global
echo '(function() { var module, exports, define;' > scripts/tmp.js
# load ractive
cat node_modules/ractive/ractive.js >> scripts/tmp.js
# turn off debug output
echo 'Ractive.DEBUG = false;' >> scripts/tmp.js
# load raport and the designer (for docs), also the docs evaluator
cat lib/raport.umd.js design/raport.design.umd.js scripts/build-docs.js >> scripts/tmp.js
# close the hidey function and call it
echo '})();' >> scripts/tmp.js
# run the generated script and write Operators.md
node scripts/tmp.js > Operators.md
# hide the evidence
rm scripts/tmp.js
