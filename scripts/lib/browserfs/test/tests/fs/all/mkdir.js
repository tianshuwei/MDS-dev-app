define([], function() { return function(){
  var rootFS = fs.getRootFS();
  if (rootFS.isReadOnly()) return;
  fs.writeFile('does/not/exist.txt', 'BFS plz don\'t create this', function(err) {
    if (!err) throw new Error('Created a file in a nonexistant directory!');
    fs.mkdir('does', function(err) {
      if (err) throw err;
      fs.mkdir('does/not', function(err) {
        if (err) throw err;
        fs.writeFile('does/not/exist.txt', 'Should work', function(err) {
          if (err) throw err;
        });
      });
    });
  });
};});
