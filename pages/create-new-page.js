import Link from 'next/link';
import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import NewNote from '../components/new-note.js';
import TagPanel from '../components/tag-panel.js';
import { resetServerContext } from 'react-beautiful-dnd';


//outtermost Class on page : CreateNewPage
class CreateNewPage extends React.Component{
  //constructor
  constructor(props){
    super(props);
    this.handlePublishClick=this.handlePublishClick.bind(this);
    this.handleNoteInputChange=this.handleNoteInputChange.bind(this);
    this.handleTagInputChange=this.handleTagInputChange.bind(this);
    this.handleTagKeyPress=this.handleTagKeyPress.bind(this);
    this.handleTagBarClick=this.handleTagBarClick.bind(this);
    this.handleETagClick=this.handleETagClick.bind(this);
    this.handleWTagClick=this.handleWTagClick.bind(this);
    this.handleDragEnd=this.handleDragEnd.bind(this);
    this.analyzeNote=this.analyzeNote.bind(this);
    this.pushNoteToDB=this.pushNoteToDB.bind(this);
    this.state= {
      taginput: "",
      note: {
        _id: 0,
        input: "This is my note",
        tags: []
      },
      tagsTable: props.tagsTable,
      rootTags: props.rootTags,
      wRecs: []
    };
  }

  //Handler functions
  //change of input in the note text field
  handleNoteInputChange(event){
    const cNote = this.state.note;
    this.setState({note: {
      input: event.target.value,
      tags: cNote.tags
    }});
  }

  //change of input in the tag text field
  handleTagInputChange(event){
    const newI = event.target.value;
    this.setState({
      taginput: newI
    });
  }

  //handles onClick event for the publish button (analyzes and pushes a note to DB)
  async handlePublishClick(event){
    var noteInput=this.state.note.input;
    this.analyzeNote(noteInput);
  }

  //helper functions for handlePublishClick
  async analyzeNote(){
    fetch('http://localhost:3000/api/watson-analyzenote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: this.state.note.input,
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
    let wRecs = await wRecs;

    fetch('http://localhost:3000/api/mongo-insertnote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: this.state.note.input,
        tags: this.state.note.tags,
        wRecs: wRecs
      })
    })
    .catch(error => {
      console.error('DB push error:', error);
    });
  }

  //handles onClick event for any tagBar tag
  handleTagBarClick(event, tag){
    var tags = this.state.note.tags;
    var tagsTable = this.state.tagsTable;
    const curNoteI = this.state.note.input;
    tags.splice(tags.findIndex(cV => {
      return (cV == tag);
    }), 1);
    tagsTable[tag].noteTagMatch = 0;
    this.setState({
      note: {
        _id: 0,
        input: curNoteI,
        tags: tags
      },
      tagsTable: tagsTable
    });
  }

  //handles onClick event for any extant tag click
  handleETagClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    const curNoteI = this.state.note.input;
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
        _id: 0,
        input: curNoteI,
        tags: tags
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
        input: this.state.note.input,
        tags: curNoteT
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
    const input = event.target.value;
    const tag = {
      _id: input,
      children: [],
      notes: [],
      parent: null
    }
    var tagsTable = this.state.tagsTable;
    var noteTags = this.state.note.tags.slice();
    var data = tagsTable[input];
    if(typeof data === 'undefined'){
      var data2 = tagsTable[input.toLowerCase()];
      if(typeof data2 !== 'undefined'){
        data = data2;
      }
      else{
        const newString = input.charAt(0).toUpperCase().concat(input.substr(1));
        var data3 = tagsTable[newString];
        if(typeof data3 !== 'undefined'){
          data = data3;
        }
        else{
          //add as tag if here
          return;
        }
      }
    }
    noteTags.push(data._id);
    var tagInput = "";
    this.setState({
      taginput: tagInput,
      note: {
        tags: noteTags
      }
    });
    return;
  }

  //handles dragEnd event for the tagPanel
  async handleDragEnd(result){
    //if no result, return
    if(!result){
      return;
    }
    console.log("results: ", result);
    //if a combine
    if(result.combine){
      var rootTags = this.state.rootTags.slice();
      var tagsTable = this.state.tagsTable;
      const targetTagID = result.combine.draggableId;
      //if came from watson suggestion
      if(result.source.droppableId=="wstags"){
        console.log(result.draggableId);
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
            <div className={styles.placeholder}/>
          }

          right = {
            <SplitPane
              className = {styles.splitpane}
              styleleft = {styles.splitpaneleft2}
              styleright = {styles.splitpaneright2}

              left = {
                <NewNote
                  tagInput = {this.state.taginput}
                  cTags = {this.state.note.tags}
                  onKeyPress = {this.handleTagKeyPress}
                  onTagInputChange = {this.handleTagInputChange}
                  tagBarOnClick = {this.handleTagBarClick}
                  handleNoteInputChange = {this.handleNoteInputChange}
                  noteInput = {this.state.note.input}
                  handlePublishClick = {this.handlePublishClick}
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
//handles api calls for inserting {draggedTag} as a child of {targetTag}, also returning updated newState
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

export async function getStaticProps(context) {
  resetServerContext();
  const res = await fetch('http://localhost:3000/api/mongo-gettags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  var tags = await res.json();
  var roots = [];

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
      rootTags: roots
    }
  };
}

export default CreateNewPage;
