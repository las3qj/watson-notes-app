import Link from 'next/link';
import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import NewNote from '../components/new-note.js';
import TagPanel from '../components/tag-panel.js';
import NoteSelect from '../components/note-select.js';
import { caseInsensitiveSearch, specialCharacterParse, searchParse } from '../util/string-parsing.js';
import { resetServerContext } from 'react-beautiful-dnd';


//outtermost Class on page : CreateNewPage
class CreateNewPage extends React.Component{
  //constructor
  constructor(props){
    super(props);
    this.handleNoteSelectClick=this.handleNoteSelectClick.bind(this);
    this.handlePublishClick=this.handlePublishClick.bind(this);
    this.handleSaveClick=this.handleSaveClick.bind(this);
    this.handleNewNoteClick=this.handleNewNoteClick.bind(this);
    this.handleNoteInputChange=this.handleNoteInputChange.bind(this);
    this.handleTagInputChange=this.handleTagInputChange.bind(this);
    this.handleSearchInputChange=this.handleSearchInputChange.bind(this);
    this.handleTagKeyPress=this.handleTagKeyPress.bind(this);
    this.handleSearchKeyPress=this.handleSearchKeyPress.bind(this);
    this.handleTagBarClick=this.handleTagBarClick.bind(this);
    this.handleETagClick=this.handleETagClick.bind(this);
    this.handleWTagClick=this.handleWTagClick.bind(this);
    this.handleDragEnd=this.handleDragEnd.bind(this);
    this.analyzeNote=this.analyzeNote.bind(this);
    this.pushNoteToDB=this.pushNoteToDB.bind(this);
    this.state= {
      tagInput: "",
      searchInput: "/All",
      note: {
        _id: null,
        content: "This is my note",
        tags: [],
        wRecs: []
      },
      tagsTable: props.tagsTable,
      rootTags: props.rootTags,
      wRecs: [],
      curNotes: props.curNotes,
      curQuery: props.curQuery
    };
  }

  //Handler functions
  //change of input in the note text field
  handleNoteInputChange(event){
    const cNote = this.state.note;
    this.setState({note: {
      _id: this.state.note._id,
      content: event.target.value,
      tags: cNote.tags,
      wRecs: this.state.note.wRecs
    }});
  }

  //change of input in the tag text field
  handleTagInputChange(event){
    const newI = event.target.value;
    this.setState({
      tagInput: newI
    });
  }

  handleSearchInputChange(event){
    const newI = event.target.value;
    if(newI.indexOf("&") !==-1 && (newI.indexOf("|") !== -1 || newI.indexOf("/") !== -1 || newI.indexOf("\\") !== -1) ){
      return;
    }
    if(newI.indexOf("|") !==-1 && (newI.indexOf("&") !== -1 || newI.indexOf("/") !== -1 || newI.indexOf("\\") !== -1) ){
      return;
    }
    if((newI.trim().indexOf("/", 1) > -1 || newI.trim().indexOf("\\", 1) > -1 )){
      return;
    }
    this.setState({
      searchInput: newI
    });
  }

  async handleSaveClick(event){
    var curNotes = this.state.curNotes.slice();
    const id = this.state.note._id;
    const ind = curNotes.findIndex(note => note._id == this.state.note._id);
    //if it should be in curNotes
    if(handleCheckAgainstQuery(this.state.note.tags, this.state.curQuery)){
      //but its not
      if(ind == -1){
        curNotes.push(this.state.note);
        this.setState({curNotes: curNotes});
      }
      //if it is, update it
      else{
        curNotes[ind] = this.state.note;
        this.setState({curNotes: curNotes});
      }
    }
    //if it should NOT be in curNotes
    else{
      //but it is
      if(ind > -1){
        curNotes.splice(ind, 1);
        this.setState({curNotes: curNotes});
      }
      //if it isnt, do nothing
    }

    fetch('http://localhost:3000/api/mongo-updatenote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.note)
    });
  }

  handleNewNoteClick(event){
    handleResetMatches(this.state.tagsTable, this.state.note.tags);
    var newNote = {
      _id: null,
      content: "Type here!",
      tags: [],
      wRecs: []
    };
    this.setState({note: newNote, wRecs: []});
  }
  //handles onClick event for the publish button (analyzes and pushes a note to DB)
  async handlePublishClick(event){
    this.analyzeNote();
  }
  //helper functions for handlePublishClick
  async analyzeNote(){
    fetch('http://localhost:3000/api/watson-analyzenote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: this.state.note.content,
      })
    })
    .then(response => response.json())
    .then(jso => jso.result)
    .then(result => {
      var entities = result.entities;
      var concepts = result.concepts;
      var keywords = result.keywords;
      const wRecs = parseWatsonRecs(concepts, entities, keywords);
      this.setState({
        wRecs: wRecs
      });
      return(wRecs);
    })
    .then(tags => this.pushNoteToDB(tags));
  }

  async pushNoteToDB(tags){
    let wRecs = await tags;

    fetch('http://localhost:3000/api/mongo-insertnote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: this.state.note.content,
        tags: this.state.note.tags,
        wRecs: wRecs
      })
    }).then(r => {
      return fetch('http://localhost:3000/api/mongo-getnotefromcontent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: this.state.note.content,
        })
      });
    }).then(r => r.json())
    .then(promise => this.updateNoteId(promise));
  }

  async updateNoteId(prom){
    const res = await prom;
    const id = res[0]._id;
    const newNote = {
      _id: id,
      content: this.state.note.content,
      tags: this.state.note.tags,
      wRecs: this.state.wRecs
    };
    var cNotes = this.state.curNotes;
    //REVIEW -- also needs to check if a dif query if curNote fits the query
    if(handleCheckAgainstQuery(newNote.tags, this.state.curQuery)){
      cNotes.push(newNote);
    }

    this.setState({
      note: newNote,
      curNotes: cNotes
    });
  }

  handleNoteSelectClick(event, note){
    handleResetMatches(this.state.tagsTable, this.state.note.tags);
    this.setState({
      note: {
        _id: note._id,
        content: note.content,
        tags: note.tags,
        wRecs: note.wRecs
      },
      wRecs: note.wRecs
    });
  }

  //handles onClick event for any tagBar tag
  handleTagBarClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    const curNoteI = this.state.note.content;
    tags.splice(tags.findIndex(cV => {
      return (cV == tag);
    }), 1);
    tagsTable[tag].noteTagMatch = 0;
    this.setState({
      note: {
        _id: this.state.note._id,
        content: curNoteI,
        tags: tags,
        wRecs: this.state.note.wRecs
      },
      tagsTable: tagsTable
    });
  }

  //handles onClick event for any extant tag click
  handleETagClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    const curNoteI = this.state.note.content;
    if(event.target.className==styles.removetagbutton){
      tags.splice(tags.findIndex(cV => cV == tag), 1);
      tagsTable[tag].noteTagMatch=0;
    }
    else{
      tags.push(tag);
      tags.sort((a,b) => {
        if(a < b){
          return -1;
        }
        else{
          return 1;
        }
      });
    }
    this.setState({
      note: {
        _id: this.state.note._id,
        content: curNoteI,
        tags: tags,
        wRecs: this.state.note.wRecs
      }
    });
  }

  //handles onClick event for any watson tag click
  async handleWTagClick(event, id){
    var newT = {
      _id: id,
      children: [],
      notes: [],
      parent: null
    }
    var tagsTable = this.state.tagsTable;
    var curRoots = this.state.rootTags;
    var curNoteT = this.state.note.tags;
    curNoteT.push(id);
    curNoteT.sort((a,b) => {
      if(a < b){
        return -1;
      }
      else{
        return 1;
      }
    });
    //check if newT already exists in tags
    const data = tagsTable[id];
    //if not in there, insert as rootTag
    if(typeof data === 'undefined'){
      curRoots = handleInsertNewRootTag(newT, tagsTable, curRoots.slice());
    }
    //remove the suggestion from the proper array
    const wRes = handleWRecDelete(id, this.state.wRecs.slice());
    this.setState({
      note: {
        _id: this.state.note._id,
        content: this.state.note.content,
        tags: curNoteT,
        wRecs: this.state.note.wRecs
      },
      rootTags: curRoots,
      tagsTable: tagsTable,
      wRecs: wRes
    });
  }

  //handles keyPress event for the tag input box
  //REVIEW--unfinished method
  async handleTagKeyPress(event){
    //escapes this method if the key is not 'Enter'
    if(event.key !== "Enter"){
      return;
    }
    const input = event.target.value.trim();
    var tagsTable = this.state.tagsTable;
    var rootTags = this.state.rootTags.slice();
    var noteTags = this.state.note.tags.slice();
    var data = tagsTable[input];
    if(typeof data === 'undefined'){
      var key = caseInsensitiveSearch(input, tagsTable);
      if(typeof key !== 'undefined'){
        data = tagsTable[key];
      }
      else{
        const path = specialCharacterParse(input);
        //if path is only one string, insert as a root tag and add to note tags
        if(path.length==1){
          const newTag = {
            _id: input,
            children: [],
            notes: [],
            parent: null
          };
          const newRoots = handleInsertNewRootTag(newTag, tagsTable, rootTags);
          this.setState({
            rootTags: newRoots
          });
          data = newTag;
        }
        else{
          data = tagsTable[helperInsertPath(path)];
        }
      }
    }
    noteTags.push(data._id);
    var tagInput = "";
    this.setState({
      tagInput: tagInput,
      note: {
        _id: this.state.note._id,
        content: this.state.note.content,
        tags: noteTags,
        wRecs: this.state.note.wRecs
      },
      tagsTable: tagsTable,
      rootTags: rootTags
    });
    return;
    function helperInsertPath(path){
      var prev = null;
      for(var n=0; n<path.length; n++){
        var curr = tagsTable[path[n]];
        //if it doesnt appear to be an extant tag
        if(typeof curr === 'undefined'){
          const newKey = caseInsensitiveSearch(path[n], tagsTable);
          //if it is an extant tag after all
          if(typeof curr !== 'undefined'){
            curr = tagsTable[newKey];
          }
          //if it is in fact a new tag
          else{
            //if n==0, insert new root tag!
            if(n==0){
              const newTag = {
                _id: path[n],
                children: [],
                notes: [],
                parent: null
              };
              rootTags = handleInsertNewRootTag(newTag, tagsTable, rootTags);
              curr = tagsTable[path[n]];
            }
            //else, insert as a subtag!
            else{
              const newTag = {
                _id: path[n],
                children: [],
                notes: [],
                parent: prev
              };
              var promise = Promise.resolve("complete");
              handleInsertNewSubTag(newTag, prev, tagsTable, rootTags, promise);
              curr = tagsTable[path[n]];
            }
          }
        }
        prev = curr._id;
      }
      return prev;
    }
  }

  async handleSearchKeyPress(event){
    if (event.key !== "Enter"){
      return;
    }
    const input = event.target.value.trim();
    const res = searchParse(input);
    this.handleNoteSearch(res);
  }

  async handleNoteSearch(results){
    const type=results.type;
    var promise;
    var newQuery;
    if(type == "command"){
      if(results.command == "all"){
        promise = fetch('http://localhost:3000/api/mongo-getallnotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        newQuery = {
          type: "command",
          command: "all"
        };
      }
    }
    else if(type == "tag"){
      const key = caseInsensitiveSearch(results.tag, this.state.tagsTable);
      if(typeof key === 'undefined'){
        this.setState({searchInput: "tag: "+results.tag+" not found"});
        return;
      }
      else{
        promise = fetch('http://localhost:3000/api/mongo-getnotefromtag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({tag: key})
        });
        newQuery = {
          type: "tag",
          tag: key
        };
      }
    }
    //if multi-tag search
    else if(type == "ortags" || type == "andtags"){
      const tagsArray = results.tags;
      var newTags = [];
      //iterate, double-checking that these tags are valid
      for(var n=0; n<tagsArray.length; n++){
        newTags[n] = [];
        for(var m=0; m<tagsArray[n].length; m++){
          const key = caseInsensitiveSearch(tagsArray[n][m], this.state.tagsTable);
          if(typeof key !== 'undefined'){
            newTags[n].push(key);
          }
          else{
            console.log("tag "+tagsArray[n][m]+" not found");
          }
        }
      }
      //if any array is now empty, remove it
      for(var p=newTags.length-1; p>=0; p--){
        if(newTags[p].length==0){
          newTags.splice(p, 1);
        }
      }
      //if no tags remain...
      if(newTags.length==0){
        console.log("no valid tags to search");
        return;
      }
      promise = fetch('http://localhost:3000/api/mongo-getnotefromtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({tags: newTags})
      });
      newQuery = {
        type: type,
        tags: newTags
      };
    }
    //update notes
    promise.then(res => res.json())
    .then(notes => {
      handleResetMatches(this.state.tagsTable, this.state.note.tags);
      this.setState({
        curNotes: notes,
        curQuery: newQuery
      });
    });
  }

  //handles dragEnd event for the tagPanel
  async handleDragEnd(result){
    //if no result, return
    if(!result){
      return;
    }
    //if a combine
    if(result.combine){
      var rootTags = this.state.rootTags.slice();
      var tagsTable = this.state.tagsTable;
      const targetTagID = result.combine.draggableId;
      //if came from watson suggestion
      if(result.source.droppableId=="wstags"){
        const tagID = result.draggableId.substr(2);
        const newTag = {
          _id: tagID,
          children: [],
          notes: [],
          parent: targetTagID
        };
        var promise = Promise.resolve("complete");
        handleInsertNewSubTag(newTag, targetTagID, tagsTable, rootTags.slice(), promise);
        const newWRecs = handleWRecDelete(tagID, this.state.wRecs.slice());
        this.setState({
          rootTags: rootTags,
          wRecs: newWRecs
        });
        return;
      }
      //else it came from extant tags
      else{
        //get draggedTag
        //REVIEW--likely bug...
        const draggedTagID = result.draggableId;
        //call handleMoveTag
        const newRoots = handleMoveTag(draggedTagID, targetTagID, tagsTable, rootTags.slice());
        this.setState({
          rootTags: newRoots
        });
        return;
      }
    }
    else{
      if(!result.destination){
        return;
      }
      //add tag as Root tag if attempting to drop anywhere
      if(result.destination.index>=0){
        var tagsTable = this.state.tagsTable;
        var rootTags = this.state.rootTags.slice();
        if(result.source.droppableId=="wstags"){
          const tagID = result.draggableId.substr(2);
          const newTag = {
            _id: tagID,
            children: [],
            notes: [],
            parent: null
          };
          const newRoots = handleInsertNewRootTag(newTag, tagsTable, rootTags);
          const newWRecs = handleWRecDelete(tagID, this.state.wRecs.slice());
          this.setState({
            rootTags: newRoots,
            wRecs: newWRecs
          });
          return;
        }
        else{
          //unless already a root tag
          if(tagsTable[result.draggableId].parent==null){
            return;
          }
          var tagsTable = this.state.tagsTable;
          var rootTags = this.state.rootTags.slice();
          rootTags = handleMoveTag(result.draggableId, null, tagsTable, rootTags);
          this.setState({
            rootTags: rootTags
          });
          return;
        }
      }
    }
  }

  //the render method
  render(){
    return (
      <div className={styles.layout}>
        <SplitPane
          className = {styles.splitpane}
          styleleft = {styles.splitpaneleft1}
          styleright = {styles.splitpaneright1}

          left = {
            <NoteSelect
              notes = {this.state.curNotes}
              onNoteClick = {this.handleNoteSelectClick}
              onSearchInputChange = {this.handleSearchInputChange}
              onSearchKeyPress = {this.handleSearchKeyPress}
              searchInput = {this.state.searchInput}
            />
          }

          right = {
            <SplitPane
              className = {styles.splitpane}
              styleleft = {styles.splitpaneleft2}
              styleright = {styles.splitpaneright2}

              left = {
                <NewNote
                  tagInput = {this.state.tagInput}
                  cTags = {this.state.note.tags}
                  onKeyPress = {this.handleTagKeyPress}
                  onTagInputChange = {this.handleTagInputChange}
                  tagBarOnClick = {this.handleTagBarClick}
                  handleNoteInputChange = {this.handleNoteInputChange}
                  noteInput = {this.state.note.content}
                  handlePublishClick = {this.handlePublishClick}
                  handleSaveClick = {this.handleSaveClick}
                  handleNewNoteClick = {this.handleNewNoteClick}
                />
              }

              right = {
                <TagPanel
                  onDragEnd = {this.handleDragEnd}
                  tagsTable = {this.state.tagsTable}
                  rootTags = {this.state.rootTags}
                  noteTags = {this.state.note.tags}
                  onExClick = {this.handleETagClick}
                  onWsClick = {this.handleWTagClick}
                  wRecs = {this.state.wRecs}
                />
              }
            />
          }
        />
      </div>
    );
  }
}

function SplitPane(props) {
  return (
    <div className={styles.splitpane}>
      <div className={props.styleleft}>
        {props.left}
      </div>
      <div className={props.styleright}>
        {props.right}
      </div>
    </div>
  );
}

//handles api calls for moving {draggedTagID} to {targetTagID}, also returning updated roots
function handleMoveTag(draggedTagID, targetTagID, tagsTable, rootTags){
  //two steps to 'delete':
  // 1: give children to parent (make roots if a root tag)
  // 2: give parent to children (null if a root tag)
  rootTags = handleRemoveTagRefs(draggedTagID, tagsTable, rootTags.slice());
  //two steps to 'add':
  // 1: set new parent (targetTagID)
  // 2: add to parent's children list
  rootTags = handleReInsertTag(draggedTagID, targetTagID, tagsTable, rootTags.slice());
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//handles api calls for removing references to draggedTagID either in parent
//or children fields of other tags, updates their DB entries, but not the entry of draggedTag
function handleRemoveTagRefs(draggedTagID, tagsTable, rootTags){
  const draggedTag = tagsTable[draggedTagID];
  //for every child, updating parent to be the draggedTag's parent
  var newChildren = [];
  for(var n=0; n<draggedTag.children.length; n++){
    tagsTable[draggedTag.children[n]].parent = draggedTag.parent;
    newChildren.push(draggedTag.children[n]);
  }
  //update the parent field for all those children in the DB
  fetch('http://localhost:3000/api/mongo-updateparents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({prevP: draggedTagID, newP: draggedTag.parent})
  });
  if(draggedTag.parent==null){
    const ind = rootTags.findIndex(el => el == draggedTagID);
    //const args = [ind, 1].concat(newChildren);
    //rootTags.splice.apply(undefined, args);
    rootTags.splice(ind, 1, ...newChildren);
    if(newChildren.size>0){
      fetch('http://localhost:3000/api/mongo-inserttags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({tags: newChildren})
      });
    }
  }
  else{
    var children = tagsTable[draggedTag.parent].children.slice();
    const ind = children.findIndex(el => el == draggedTagID);
    children.splice(ind, 1, ...newChildren);
    tagsTable[draggedTag.parent].children = children;
    const newParent = tagsTable[draggedTag.parent];
    fetch('http://localhost:3000/api/mongo-updatetag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newParent)
    });
  }
  return rootTags;
}
function handleReInsertTag(draggedTagID, targetTagID, tagsTable, rootTags){
  tagsTable[draggedTagID].parent = targetTagID;
  tagsTable[draggedTagID].children = [];
  const newT = tagsTable[draggedTagID];
  fetch('http://localhost:3000/api/mongo-updatetag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newT)
  });
  //if reinserting at root
  if(targetTagID==null){
    rootTags.push(draggedTagID);
    return rootTags;
  }
  var children = tagsTable[targetTagID].children.slice();
  children.push(draggedTagID);
  tagsTable[targetTagID].children = children;
  const newParent = tagsTable[targetTagID];
  fetch('http://localhost:3000/api/mongo-updatetag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newParent)
  });
  return rootTags;
}
//handles api calls for inserting {newTag} as a child of {targetTag}, also returning updated newState
//currently only supports inserting a childless tag
function handleInsertNewSubTag(newTag, targetTagID, tagsTable, rootTags, promise){
  insertNewSubTag(newTag, targetTagID, tagsTable);
  const target = tagsTable[targetTagID];
  //insert the new tag into the database
  //also update the children of the parent tag
  promise.then(res => {
    fetch('http://localhost:3000/api/mongo-updatetag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(target)
    });
    fetch('http://localhost:3000/api/mongo-inserttag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTag)
    })
  });
  handleRefreshIndices(tagsTable, rootTags);
  return;
}
//inserts {newTag} into tagsTable as a child of {targetTag}
//assuming newTag is not to be a rootTag
function insertNewSubTag(newTag, targetTagID, tagsTable){
  tagsTable[newTag._id] = newTag;
  const targetTag = tagsTable[targetTagID];
  var children = targetTag.children.slice();
  children.push(newTag._id);
  tagsTable[targetTag._id].children = children;
  return;
}
//inserts {newTag} as a root into tagsTable, rootTags, and DB, returning updated rootTags
function handleInsertNewRootTag(newTag, tagsTable, rootTags){
  tagsTable[newTag._id] = newTag;
  rootTags.push(newTag._id);
  fetch('http://localhost:3000/api/mongo-inserttag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTag)
  });
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//refreshes the indices in tagsTable based on the roots array
function handleRefreshIndices(tagsTable, roots){
  var curIndex = 0;
  for(var m=0; m<roots.length; m++){
    curIndex = helperRecurseIndices(roots[m], curIndex);
  }
  //updates hashTable with proper index, always returns the index for the next tag
  function helperRecurseIndices(tag, index){
    tagsTable[tag].index=index;
    var nextI = index+1;
    const children = tagsTable[tag].children;
    for(var o=0; o<children.length; o++){
      nextI = helperRecurseIndices(children[o], nextI)
    }
    return nextI;
  }
}
//handles resetting any matches with curNotes
function handleResetMatches(tagsTable, curNotes){
  for(var n=0; n<curNotes.length; n++){
    tagsTable[curNotes[n]].noteTagMatch = 0;
  }
}
//parses three arrays into a single array, sorted by relevance and removed of repeated elements (case insensitive)
function parseWatsonRecs(con, ent, kyw){
  var results = [];
  //O (n^2) check for duplicates
  //loop through concepts
  for(var c=0; c<con.length; c++){
    const ind = results.findIndex(val => val._id.toLowerCase() == con[c].text.toLowerCase());
    if(ind < 0){
      const newT = {
        _id: con[c].text,
        relevance: con[c].relevance,
        type: "concept"
      };
      results.push(newT);
    }
  }
  //loop through entities
  for(var e=0; c<ent.length; e++){
    const ind = results.findIndex(val => val._id.toLowerCase() == ent[e].text.toLowerCase());
    if(ind < 0){
      const newT = {
        _id: ent[e].text,
        relevance: ent[e].relevance,
        type: "entity"
      };
      results.push(newT);
    }
  }
  //loop through keywords
  for(var k=0; k<kyw.length; k++){
    const ind = results.findIndex(val => val._id.toLowerCase() == kyw[k].text.toLowerCase());
    if(ind < 0){
      const newT = {
        _id: kyw[k].text,
        relevance: kyw[k].relevance,
        type: "keyword"
      };
      results.push(newT);
    }
  }
  //loop through the results to sort by relevance (array method, hopefully nlogn)
  results.sort((a,b) => {
    if(a.relevance > b.relevance){
      return -1;
    }
    else if(a.relevance < b.relevance){
      return 1;
    }
    else{
      return 0;
    }
  });
  return results;
}
//deletes the matching tag from wRecs, returning an updated wRecs state
function handleWRecDelete(id, wRecs){
  const index = wRecs.findIndex(cV => cV._id == id);
  wRecs.splice(index, 1);
  return wRecs;
}

function handleCheckAgainstQuery(tags, curQuery){
  const type = curQuery.type;
  if(type=="command" && curQuery.command == "all"){
    return true;
  }
  if(type=="tag"){
    const tag = curQuery.tag;
    if(tags.findIndex(el => el == tag) > -1){
      return true;
    }
    return false;
  }
  if(type=="ortags"){
    const qTags = curQuery.tags;
    for(var n=0; n<qTags[0].length; n++){
      if(tags.findIndex(el => el == qTags[0][n]) > -1){
        return true;
      }
    }
    return false;
  }
  if(type=="andtags"){
    const qTags = curQuery.tags;
    for(var n=0; n<qTags.length; n++){
      if(tags.findIndex(el => el ==qTags[n][0]) == -1){
        return false;
      }
    }
    return true;
  }
}

export async function getStaticProps(context) {
  resetServerContext();
  const tagsRes = await fetch('http://localhost:3000/api/mongo-gettags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  var tags = await tagsRes.json();
  var roots = [];

  const notesRes = await fetch('http://localhost:3000/api/mongo-getallnotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  var notes = await notesRes.json();

  //simultaneously populate tagsTable and roots array
  var tagsTable = {};
  for(var n=0; n<tags.length; n++){
    tagsTable[tags[n]._id] = tags[n];
    if(tags[n].parent==null){
      roots.push(tags[n]._id);
    }
  }
  //then populate hashtable with indices
  handleRefreshIndices(tagsTable, roots);
  //return as props for constructor
  return {
    props: {
      tagsTable: tagsTable,
      rootTags: roots,
      curNotes: notes,
      curQuery: {
        type: "command",
        command: "all"
      }
    }
  };
}

export default CreateNewPage;
