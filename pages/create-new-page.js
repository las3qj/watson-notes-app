import Link from 'next/link';
import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import NewNote from '../components/new-note.js';
import TagPanel from '../components/tag-panel.js';
import NoteSelect from '../components/note-select.js';
import Container from 'react-bootstrap/Container';
import { caseInsensitiveSearch, specialCharacterParse, searchParse } from '../util/string-parsing.js';
import { resetServerContext } from 'react-beautiful-dnd';


//outtermost Class on page : CreateNewPage
class CreateNewPage extends React.Component{
  //constructor
  constructor(props){
    super(props);
    this.handlePinClick=this.handlePinClick.bind(this);
    this.handleSetShowAlert=this.handleSetShowAlert.bind(this);
    this.handleNoteSelectClick=this.handleNoteSelectClick.bind(this);
    this.handlePublishClick=this.handlePublishClick.bind(this);
    this.handleSaveClick=this.handleSaveClick.bind(this);
    this.handleNewNoteClick=this.handleNewNoteClick.bind(this);
    this.handleCollapseClick=this.handleCollapseClick.bind(this);
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
        wRecs: [],
        unsavedChanges: 0
      },
      tagsTable: props.tagsTable,
      rootTags: props.rootTags,
      wRecs: [],
      curNotes: {
        fromQuery: props.curNotes,
        pins: []
      },
      curQuery: {
        external: props.curQuery.external,
        internal: props.curQuery.internal
      },
      searchAlert: {
        alertMessage: "None",
        showAlert: false
      },
      currentTheme: 2
    };
  }

  //Handler functions

  //INPUT CHANGE HANDLERS ~~~~~~~~~~~~~~~~~~~
  //change of input in the note text field
  handleNoteInputChange(event){
    const cNote = this.state.note;
    this.setState({note: {
      _id: this.state.note._id,
      content: event.target.value,
      tags: cNote.tags,
      wRecs: this.state.note.wRecs,
      unsavedChanges: 1
    }});
  }
  //change of input in the tag text field
  handleTagInputChange(event){
    const newI = event.target.value;
    this.setState({
      tagInput: newI
    });
  }
  //change of input in the search text field
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

  //BUTTON / NOTE ONCLICK HANDLERS ~~~~~~~~~~~~~~~~~~
  handleModalRename(old, newT){
    handleRenameTag(old, newT, this.state.tagsTable, this.state.rootTags.slice());
  }
  //when an alert is minimized
  handleSetShowAlert(bool, message="None"){
    this.setState({searchAlert: {alertMessage: message, showAlert: bool}});
  }
  handlePinClick(event, note){
    event.stopPropagation();
    var newNotes = this.state.curNotes.fromQuery.slice();
    var newPins = this.state.curNotes.pins.slice();
    const mainNote = this.state.note;
    var newMainNote = mainNote;

    if(!note.isPinned){
      if(note.isActive){
        newMainNote = {
          _id: mainNote._id,
          content: mainNote.content,
          tags: mainNote.tags,
          unsavedChanges: mainNote.unsavedChanges,
          wRecs: mainNote.wRecs,
          isPinned: 1
        };
      }
      const newNote = {
        _id: note._id,
        content: note.content,
        tags: note.tags,
        wRecs: note.wRecs,
        isActive: note.isActive,
        isPinned: 1
      };
      const ind = newNotes.findIndex(el => el._id == note._id);
      newNotes.splice(ind, 1);
      newPins.push(newNote);
    }
    else{
      if(note.isActive){
        newMainNote = {
          _id: mainNote._id,
          content: mainNote.content,
          tags: mainNote.tags,
          unsavedChanges: mainNote.unsavedChanges,
          wRecs: mainNote.wRecs,
          isPinned: 0
        };
      }
      const newNote = {
        _id: note._id,
        content: note.content,
        tags: note.tags,
        wRecs: note.wRecs,
        isActive: note.isActive,
        isPinned: 0
      };
      const ind = newPins.findIndex(el => el._id == note._id);
      newPins.splice(ind, 1);
      if(handleCheckAgainstQuery(note.tags.slice(), this.state.curQuery)){
        newNotes.push(newNote);
      }
    }
    this.setState({
      note: newMainNote,
      curNotes: {
        fromQuery: newNotes,
        pins: newPins }
    });

  }
  //when a collapse icon is clicked
  handleCollapseClick(event, tag){
    var tagsTable = this.state.tagsTable;
    if(tagsTable[tag].children.length==0){
      return;
    }
    else{
      if(tagsTable[tag].isCollapsed){
        tagsTable[tag].isCollapsed = 0;
      }
      else{
        tagsTable[tag].isCollapsed = 1;
      }
    }
    this.setState({tagsTable: tagsTable});
  }
  //when the save button is clicked
  async handleSaveClick(event){
    var curNotes = this.state.curNotes.fromQuery.slice();
    var pins = this.state.curNotes.pins.slice();
    const id = this.state.note._id;
    var qInd = -1;
    var pInd = pins.findIndex(note => note._id == this.state.note._id);
    if(pInd<0){
      qInd = curNotes.findIndex(note => note._id == this.state.note._id);
    }

    //if it should be in curNotes
    if(handleCheckAgainstQuery(this.state.note.tags, this.state.curQuery)){
      //but its not
      if(qInd == pInd == -1){
        curNotes.push(this.state.note);
        this.setState({curNotes: {fromQuery: curNotes, pins: this.state.curNotes.pins}});
      }
      //if it is, update it
      else if(qInd>-1){
        curNotes[qInd] = this.state.note;
        this.setState({curNotes: {fromQuery: curNotes, pins: this.state.curNotes.pins}});
      }
      else{
        pins[pInd] = this.state.note;
        this.setState({curNotes: {fromQuery: this.state.curNotes.fromQuery, pins: pins}});
      }
    }
    //if it should NOT be in curNotes
    else{
      //but it is
      if(qInd > -1){
        curNotes.splice(ind, 1);
        this.setState({curNotes: {fromQuery: curNotes, pins: this.state.curNotes.pins}});
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
    this.setState({note: {
      ...this.state.note,
      unsavedChanges: 0
    }});
  }
  //when the new note button is clicked
  handleNewNoteClick(event){
    handleResetMatches(this.state.tagsTable, this.state.note.tags, this.state.wRecs);
    var newNote = {
      _id: null,
      content: "Type here!",
      tags: [],
      wRecs: [],
      unsavedChanges: 0
    };
    this.setState({note: newNote, wRecs: []});
  }
  //when the publish botton is clicked (analyzes and pushes a note to DB)
  async handlePublishClick(event){
    this.analyzeNote();
  }
  //helper functions for handlePublishClick
  //pushes note content to watson, requests wRecs
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
  //pushes note and new wRecs to mongodb
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
  //retrieves new note ID from mongo DB
  async updateNoteId(prom){
    const res = await prom;
    const id = res[0]._id;
    const newNote = {
      _id: id,
      content: this.state.note.content,
      tags: this.state.note.tags,
      wRecs: this.state.wRecs,
      unsavedChanges: 0
    };
    var cNotes = this.state.curNotes.fromQuery.slice();
    //checks current note against current query
    if(handleCheckAgainstQuery(newNote.tags, this.state.curQuery)){
      cNotes.push(newNote);
    }

    this.setState({
      note: newNote,
      curNotes: {fromQuery: cNotes, pins: this.state.curNotes.pins}
    });
  }
  //when a new note is clicked/selected from note-select
  handleNoteSelectClick(event, note){
    if(note.isActive){
      return;
    }
    //reset current match flags in wRecs & extant tags
    handleResetMatches(this.state.tagsTable, this.state.note.tags, this.state.wRecs);
    var curNotes = this.state.curNotes.fromQuery.slice();
    var pins = this.state.curNotes.pins.slice();
    if(this.state.note.isPinned){
      var index = pins.findIndex(el => el._id==this.state.note._id);
      var updatedNote = {
        _id: pins[index]._id,
        content: pins[index].content,
        tags: pins[index].tags,
        wRecs: pins[index].wRecs,
        isActive: 0,
        isPinned: 1
      }
      pins[index] = updatedNote;
    }
    else if(this.state.note._id!=null && curNotes.findIndex(el => el._id==this.state.note._id)!=-1){
      var index = curNotes.findIndex(el => el._id==this.state.note._id);
      var updatedNote = {
        _id: curNotes[index]._id,
        content: curNotes[index].content,
        tags: curNotes[index].tags,
        wRecs: curNotes[index].wRecs,
        isActive: 0,
        isPinned: 0
      }
      curNotes[index] = updatedNote;
    }
    var newNote = {
      _id: note._id,
      content: note.content,
      tags: note.tags,
      wRecs: note.wRecs,
      unsavedChanges: 0,
      isPinned: note.isPinned,
      isActive: 1
    };
    if(note.isPinned){
      var ind = pins.findIndex(el => el._id == note._id);
      pins[ind] = newNote;
    }
    else{
      var ind = curNotes.findIndex(el => el._id == note._id);
      curNotes[ind] = newNote;
    }
    this.setState({
      note: newNote,
      curNotes: {
        fromQuery: curNotes,
        pins: pins
      },
      wRecs: note.wRecs
    });
  }
  //when a tag button in the tag bar is clicked
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
        wRecs: this.state.note.wRecs,
        unsavedChanges: 1
      },
      tagsTable: tagsTable
    });
  }
  //when an extant tag button is clicked in tag-panel
  handleETagClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    var curNoteTags = this.state.note.tags;
    const curNoteI = this.state.note.content;
    if(curNoteTags.findIndex(el => el.toLowerCase() == tag.toLowerCase()) > -1){
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
        wRecs: this.state.note.wRecs,
        unsavedChanges: 1
      }
    });
  }
  //when a watson tag button is clicked in tag-panel
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
    //check if newT already exists in tags
    const key = caseInsensitiveSearch(id, tagsTable);
    if(typeof key !== 'undefined'){
      newT._id = key;
    }
    else{
      curRoots = handleInsertNewRootTag(newT, tagsTable, curRoots.slice());
    }

    curNoteT.push(newT._id);
    curNoteT.sort((a,b) => {
      if(a < b){
        return -1;
      }
      else{
        return 1;
      }
    });
    //remove the suggestion from the proper array
    //REVIEW -- no longer deleting these
    //const wRes = handleWRecDelete(id, this.state.wRecs.slice());
    this.setState({
      note: {
        _id: this.state.note._id,
        content: this.state.note.content,
        tags: curNoteT,
        wRecs: this.state.note.wRecs,
        unsavedChanges: 1
      },
      rootTags: curRoots,
      tagsTable: tagsTable
    });
  }

  //KEYPRESS EVENT HANDLERS~~~~~~~~~~~~~~~~~~~~~~~~~~
  //handles keyPress event for the tag input box
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
        wRecs: this.state.note.wRecs,
        unsavedChanges: 1
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
  //handles keyPress event for the search input box
  async handleSearchKeyPress(event){
    if (event.key !== "Enter"){
      return;
    }
    const input = event.target.value.trim();
    const res = searchParse(input);
    this.handleNoteSearch(res);
  }
  //helper function for handleSearchKeyPress
  async handleNoteSearch(results){
    var tagsTable = this.state.tagsTable;
    const type=results.type;
    var promise;
    var newInt;
    var newExt;
    if(type == "command"){
      if(results.command == "all"){
        promise = fetch('http://localhost:3000/api/mongo-getallnotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        newInt = {
          type: "command",
          command: "all"
        };
        newExt = "All notes";
      }
      else if(results.command == "pins" || results.command == "pinned" || results.command == "pin"){
        newInt = {
          type: "command",
          command: "pins"
        };
        newExt = "Pinned notes";
        var empty = [];
      }
      else{
        this.handleSetShowAlert(true, "Command \""+results.command+"\" not recognized");
        return;
      }
    }
    else if(type == "tag"){
      const key = caseInsensitiveSearch(results.tag, tagsTable);
      if(typeof key === 'undefined'){
        //REVIEW
        this.handleSetShowAlert(true, "Tag \""+results.tag+"\" not found");
        return;
      }
      //if the tag has children, add those to a search query
      else if(tagsTable[key].children.length>0){
        const res = handleSearchRecurseChildren(key, tagsTable);
        promise = fetch('http://localhost:3000/api/mongo-getnotefromtags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({tags: [res]})
        });
        newExt = key+"/...";
        newInt = {
          type: "tags",
          tags: [res]
        };
      }
      else{
        promise = fetch('http://localhost:3000/api/mongo-getnotefromtag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({tag: key})
        });
        newExt = key;
        newInt = {
          type: "tag",
          tag: key
        };
      }
    }
    //if multi-tag search
    else if(type == "ortags" || type == "andtags"){
      const tagsArray = results.tags;
      var newTags = [];
      var missedTags = [];
      newExt = "";
      //iterate, double-checking that these tags are valid
      for(var n=0; n<tagsArray.length; n++){
        if(n>0){
          newExt = newExt+" & ";
        }
        newTags[n] = [];
        for(var m=0; m<tagsArray[n].length; m++){
          if(m>0){
            newExt = newExt+" | ";
          }
          const key = caseInsensitiveSearch(tagsArray[n][m], tagsTable);
          if(typeof key !== 'undefined'){
            //if has children....
            if(tagsTable[key].children.length>0){
              const res = handleSearchRecurseChildren(key, tagsTable);
              newTags[n] = newTags[n].concat(res);
              newExt = newExt+key+"/...";
            }
            else{
              newTags[n].push(key);
              newExt = newExt+key;
            }
          }
          else{
            missedTags.push(tagsArray[n][m]);
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
        this.handleSetShowAlert(true, "No valid tags in search.");
        return;
      }
      else if(missedTags.length>0){
        var alert = "Tags ";
        for(var n=0; n<missedTags.length; n++){
          if(n!=0){
            alert = alert.concat(", ");
          }
          alert = alert.concat("\""+missedTags[n]+"\"");
        }
        alert = alert.concat(" not found.");
        this.handleSetShowAlert(true, alert);
      }
      promise = fetch('http://localhost:3000/api/mongo-getnotefromtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({tags: newTags})
      });
      newInt = {
        type: type,
        tags: newTags
      };
    }
    //update notes
    if(typeof promise === 'undefined'){
      handleResetMatches(this.state.tagsTable, this.state.note.tags, this.state.wRecs);
      this.setState({
        curNotes: {
          fromQuery: [],
          pins: this.state.curNotes.pins
        },
        curQuery: {
          external: newExt,
          internal: newInt
        }
      });
      return;
    }
    promise.then(res => res.json())
    .then(notes => {
      handleResetMatches(this.state.tagsTable, this.state.note.tags, this.state.wRecs);
      this.setState({
        curNotes: {
          fromQuery: notes,
          pins: this.state.curNotes.pins
        },
        curQuery: {
          external: newExt,
          internal: newInt
        }
      });
    });
  }

  //BEAUTIFUL DND HANDLERS~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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
          rootTags: newRoots,
          tagsTable: tagsTable
        });
        return;
      }
    }
    else{
      if(!result.destination || result.destination.index==result.source.index){
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

  //RENDER METHOD ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  render(){
    return (
      <div className={"layout"}>
        <SplitPane
          className = {styles.splitpane}
          styleleft = {styles.splitpaneleft1}
          styleright = {styles.splitpaneright1}

          left = {
            <NoteSelect
              notes = {this.state.curNotes}
              onNoteClick = {this.handleNoteSelectClick}
              onPin = {this.handlePinClick}
              onSearchInputChange = {this.handleSearchInputChange}
              onSearchKeyPress = {this.handleSearchKeyPress}
              showAlert = {this.state.searchAlert.showAlert}
              setShowAlert = {this.handleSetShowAlert}
              alertMessage = {this.state.searchAlert.alertMessage}
              searchInput = {this.state.searchInput}
              curQuery = {this.state.curQuery}
              currentTheme = {this.state.currentTheme}
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
                  note = {this.state.note}
                  onKeyPress = {this.handleTagKeyPress}
                  onTagInputChange = {this.handleTagInputChange}
                  tagBarOnClick = {this.handleTagBarClick}
                  handleNoteInputChange = {this.handleNoteInputChange}
                  handlePublishClick = {this.handlePublishClick}
                  handleSaveClick = {this.handleSaveClick}
                  handleNewNoteClick = {this.handleNewNoteClick}
                  currentTheme = {this.state.currentTheme}
                />
              }

              right = {
                <TagPanel
                  onDragEnd = {this.handleDragEnd}
                  tagsTable = {this.state.tagsTable}
                  rootTags = {this.state.rootTags}
                  noteTags = {this.state.note.tags}
                  onExClick = {this.handleETagClick}
                  onCollapseClick={this.handleCollapseClick}
                  handleModalRename={this.handleModalRename}
                  onWsClick = {this.handleWTagClick}
                  wRecs = {this.state.wRecs}
                  currentTheme = {this.state.currentTheme}
                />
              }
            />
          }
        />
      </div>
    );
  }
}

//ADDITIONAL COMPONENTS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//splitpane function component
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

//ADDITIONAL HANDLER FUNCTIONS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//handles api interface for moving draggedTag to be targetTag's child--returns updated roots
function handleMoveTag(draggedTagID, targetTagID, tagsTable, rootTags){
  //two steps to 'delete':
  // 1: give children to parent (make roots if a root tag)
  // 2: give parent to children (null if a root tag)
  handleRemoveTagRefs(draggedTagID, tagsTable, rootTags.slice());
  //two steps to 'add':
  // 1: set new parent (targetTagID)
  // 2: add to parent's children list
  rootTags = handleReInsertTag(draggedTagID, targetTagID, tagsTable, rootTags.slice());
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//handles api calls for removing references to draggedTagID either in parent
//or children fields of other tags, updates their DB entries, but not the entry of draggedTag
function handleRemoveTagRefs(draggedTagID, tagsTable, rootTags, fromDelete=0){
  const draggedTag = tagsTable[draggedTagID];
  //for every child, updating parent to be the draggedTag's parent
  //if not collapsed, that is (or if fromDelete)
  var newChildren = [];
  if(!draggedTag.isCollapsed || fromDelete){
    for(var n=0; n<draggedTag.children.length; n++){
      tagsTable[draggedTag.children[n]].parent = draggedTag.parent;
      newChildren.push(draggedTag.children[n]);
    }
    handleUpdateParentsReq(draggedTagID, draggedTag.parent);
  }
  if(draggedTag.parent==null){
    const ind = rootTags.findIndex(el => el == draggedTagID);
    //const args = [ind, 1].concat(newChildren);
    //rootTags.splice.apply(undefined, args);
    rootTags.splice(ind, 1, ...newChildren);
  }
  else{
    var children = tagsTable[draggedTag.parent].children.slice();
    const ind = children.findIndex(el => el == draggedTagID);
    children.splice(ind, 1, ...newChildren);
    tagsTable[draggedTag.parent].children = children;
    const newParent = tagsTable[draggedTag.parent];
    handleUpdateTagReq(newParent);
  }
  return rootTags;
}
//updates db tags with parent=prevP to new parent
function handleUpdateParentsReq(prevP, newP){
  //update the parent field for all those children in the DB
  return fetch('http://localhost:3000/api/mongo-updateparents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({prevP: prevP, newP: newP})
  });
}
//updates db tag with new fields
function handleUpdateTagReq(newTag){
  return fetch('http://localhost:3000/api/mongo-updatetag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTag)
  });
}
//inserts draggedTag as a child of targetTag when draggedTag IS in tagsTable
function handleReInsertTag(draggedTagID, targetTagID, tagsTable, rootTags){
  tagsTable[draggedTagID].parent = targetTagID;
  if(!tagsTable[draggedTagID].isCollapsed){
    tagsTable[draggedTagID].children = [];
  }
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
//handles api calls for inserting {newTag} as a child of {targetTag}
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
    handleInsertTagReq(newTag);
  });
  handleRefreshIndices(tagsTable, rootTags);
  return;
}
//simply handles the api req for inserting a tags
function handleInsertTagReq(newTag){
  return fetch('http://localhost:3000/api/mongo-inserttag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTag)
  });
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
  handleInsertTagReq(newTag);
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//handles the renaming of a tag (deleting the old tag, replacing references
//to that tag with references to new id, updating tagsTable)
function handleRenameTag(oldId, newId, tagsTable, rootTags){
  handleDeleteTagReq(tagId);
  var tagData = tagsTable[oldId];
  var newTag = Object.assign({}, tagData, {_id: newId});
  handleReplaceTagRefs(oldId, newId, tagsTable);
  handleInsertTagReq(newTag);
  delete tagsTable.oldId;
  tagsTable[newId] = newTag;
  if(newTag.parent==null){
    rootTags[rootTags.findIndex(el => el._id==oldId)] = newTag;
  }
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//handles replacing references to oldId with references to newId in children/parent fields
function handleReplaceTagRefs(oldId, newId, tagsTable){
  handleUpdateParentsReq(oldId, newId);
  const parent = tagsTable[tagsTable[oldId].parent];
  if(parent==null){
    return;
  }
  var newChildren = parent.children.slice();
  newChildren.splice(newChildren.findIndex(el => el._id == oldId), 1);
  var newParent = Object.assign({},parent, {children: newChildren});
  handleUpdateTagReq(newParent)
}
//handles the deleting of tagId from tagsTable, the DB, and other tag references
function handleDeleteTag(tagId, tagsTable, rootTags){
  handleDeleteTagReq(tagId);
  rootTags = handleRemoveTagRefs(tagId, tagsTable, rootTags.slice(), 1);
  delete tagsTable.tagId;
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
//helper function for deleting tag from DB
async function handleDeleteTagReq(tagId){
  return fetch('http://localhost:3000/api/mongo-deletetag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({_id: tagId})
  });
}
//ensures all note tags actually EXIST,
//removes them if they do not, returning updated tags
function handleCheckNoteTags(tags, tagsTable){
  var newTags = tags.slice();
  var changes = -1;
  for(var n=tags.length-1; n>=0; n--){
    if(typeof tagsTable[tags] === 'undefined'){
      newTags.splice(n, 1);
      changes = 1;
    }
  }
  if(!changes){
    return changes;
  }
  return newTags;
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
    if(!tagsTable[tag].isCollapsed){
      for(var o=0; o<children.length; o++){
        nextI = helperRecurseIndices(children[o], nextI)
      }
    }
    return nextI;
  }
}
//handles resetting any matches with curNotes or wRecs
function handleResetMatches(tagsTable, curNotes, wRecs){
  for(var n=0; n<curNotes.length; n++){
    tagsTable[curNotes[n]].noteTagMatch = 0;
  }
  for(var m=0; m<wRecs.length; m++){
    const key = caseInsensitiveSearch(wRecs[m]._id, tagsTable);
    if(typeof key !== 'undefined'){
      tagsTable[key].wTagMatch = 0;
    }
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
//checks the tags in tags against curQuery,
//returning true if the note with tags {tags} should be in curNotes, false otherwise
function handleCheckAgainstQuery(tags, curQuery){
  const type = curQuery.internal.type;
  if(type=="command" && curQuery.internal.command == "all"){
    return true;
  }
  if(type=="tag"){
    const tag = curQuery.internal.tag;
    if(tags.findIndex(el => el == tag) > -1){
      return true;
    }
    return false;
  }
  if(type=="ortags"){
    const qTags = curQuery.internal.tags;
    for(var n=0; n<qTags[0].length; n++){
      if(tags.findIndex(el => el == qTags[0][n]) > -1){
        return true;
      }
    }
    return false;
  }
  if(type=="andtags"){
    const qTags = curQuery.internal.tags;
    for(var n=0; n<qTags.length; n++){
      if(tags.findIndex(el => el ==qTags[n][0]) == -1){
        return false;
      }
    }
    return true;
  }
}
//adds the key and all children/descendents to an 'or' search array
function handleSearchRecurseChildren(key, tagsTable){
  var res = [key];
  const children = tagsTable[key].children.slice();
  for(var n=0; n<children.length; n++){
    res = res.concat(handleSearchRecurseChildren(children[n], tagsTable));
  }
  return res;
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
        internal: {
          type: "command",
          command: "all"
        },
        external: "All notes"
      }
    }
  };
}

export default CreateNewPage;
