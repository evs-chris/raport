# for some reason rollup hangs about 3 out of 4 times
export PATH=$PATH:./node_modules/.bin

export ENV=prod

rollup -c rollup.config.js &
export PID=$!

for i in 1 2 3 4 5; do
  sleep 5;
  ps -p $PID > /dev/null
  if [ $? -ne 0 ]; then
    wait $PID
    exit $?;
  fi
done

# so kill it if it looks hung
kill $PID
exit 5;
