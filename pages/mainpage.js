import Link from 'next/link';
import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import NewNote from '../components/new-note.js';
import TagPanel from '../components/tag-panel.js';
import NoteSelect from '../components/note-select.js';
import Container from 'react-bootstrap/Container';
import {Value} from 'slate';
import { caseInsensitiveSearch, specialCharacterParse, searchParse } from '../util/string-parsing.js';

async function getInitialUserData() {
  //getting all tags
  var curTags = handleGetAllTags().then(jso => jso.json())
  .then(tags => {     //simultaneously populate tagsTable and roots array
    var roots = [];
    var tagsTable = {};
    var nameToId = {};
    tagsTable.size = tags.length;
    for(var tag of tags){
      tagsTable[tag._id] = tag;
      nameToId[tag.name] = tag._id;
      if(tag.parent==null){
        roots.push(tag._id);
      }
    }
    //then populate tagsTable with indices
    handleRefreshIndices(tagsTable, roots);
    return({tT: tagsTable, nTI: nameToId, r: roots});
  })
  .catch(()=>console.log("error with tags"));

  var curNotes = handleGetAllNotes().then(jso => jso.json())
  .catch(()=>console.log("error with notes"));
  //return as props for constructor
  return (
    {tags: await curTags, notes: await curNotes}
  );
}

async function testInitialReqs() {
  //getting all tags
  var curTags = handleGetAllTags()
  .then(tags => {     //simultaneously populate tagsTable and roots array
    console.log("tags: ",tags);
  })
  .catch(()=>console.log("error with tags"));

  var curNotes = handleGetAllNotes()
  .then(notes => console.log("notes: ",notes))
  .catch(()=>console.log("error with notes"));
  //return as props for constructor
  return (
    {tags: await curTags, notes: await curNotes}
  );
}

class MainController extends React.Component{
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
    this.handleModalRename=this.handleModalRename.bind(this);
    this.handleModalDelete=this.handleModalDelete.bind(this);
    this.handleModalRenameAdd=this.handleModalRenameAdd.bind(this);
    this.handleAddInputChange=this.handleAddInputChange.bind(this);
    this.handleAddKeyPress=this.handleAddKeyPress.bind(this);
    const initialValue = [
      {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }]
      }
    ];
    this.state= {
      //input fields
      tagInput: "",
      searchInput: "/All",
      initialValue: JSON.stringify(initialValue),
      note: {
        _id: null,
        content: JSON.stringify(initialValue),
        tags: [],
        wRecs: [],
        unsavedChanges: 0
      },
      tagsTable: {size:0},
      nameToId: {},
      rootTags: [],
      curNotes: [],
      pins: [],
      curQuery: {
        external: "/All",
        internal: {type: "command", command: "all"}
      },
      searchAlert: {
        alertMessage: "None",
        showAlert: false
      },
      currentTheme: 2
    };
  }

  componentDidMount(){
    getInitialUserData()
    .then(res => {
      this.setState({
        tagsTable: res.tags.tT,
        nameToId: res.tags.nTI,
        rootTags: res.tags.r,
        curNotes: res.notes
      });
    });
  }

  //Handler functions

  //INPUT CHANGE HANDLERS ~~~~~~~~~~~~~~~~~~~
  //change of input in the note text field
  handleNoteInputChange(value){
    const cNote = this.state.note;
    //FLAG -- should update in pins as well?
    if(this.state.note.isPinned){
      const index = this.state.pins.findIndex(el => el._id==this.state.note._id);
      var newPins = this.state.pins.slice();
      newPins[index] = Object.assign({},newPins[index],{content: value});
      this.setState({
        note: Object.assign({}, this.state.note, {
          content: value,
          unsavedChanges: 1
        }),
        pins: newPins
      });
      return;
    }
    this.setState({
      note: Object.assign({}, this.state.note, {
        content: value,
        unsavedChanges: 1
      })
    });
  }
  //change of input in the add tag text fields
  handleAddInputChange(event){
    const newI = event.target.value;
    this.setState({
      addInput: newI
    });
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
  //FLAG
  handleModalRename(oldTag, newName){
    var tagsTable = this.state.tagsTable;
    var rootTags = this.state.rootTags.slice();
    var nameToId = this.state.nameToId;
    handleRenameTag(oldTag._id, newName, tagsTable, rootTags, nameToId);
    this.setState({tagsTable: tagsTable, rootTags: rootTags, nameToId: nameToId});
  }
  handleModalRenameAdd(wTag, newName){
    var tagsTable = this.state.tagsTable;
    var rootTags = this.state.rootTags.slice();
    var nameToId = this.state.nameToId;
    var wRecs = this.state.note.wRecs.slice();
    var tags = this.state.note.tags.slice();
    var pins = this.state.pins.slice();
    var newTag = {
      _id: null,
      name: newName,
      children: [],
      parent: null
    };
    const ind = wRecs.findIndex(el=>el._id==wTag.name);
    wRecs[ind] = Object.assign({}, wRecs[ind], {_id:newName});
    handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId)
    .then(newRoots => {
      tags.push(nameToId[newName]);
      if(this.state.note.isPinned){
        const i = pins.findIndex(el=>el._id==this.state.note._id);
        pins[i] = Object.assign({},pins[i],{wRecs: wRecs, tags: tags});
      }
      //FLAG -- need to review how wRecs are stored
      //const newWRecs = handleWRecDelete(tagID, this.state.wRecs.slice());
      this.setState({
        rootTags: newRoots,
        tagsTable: tagsTable,
        nameToId: nameToId,
        pins: pins,
        note: Object.assign({}, this.state.note, {wRecs: wRecs, tags: tags, unsavedChanges: 1})
      });
      return;
    });
  }
  handleModalDelete(oldTag){
    console.log(oldTag);
    var newRoots = handleDeleteTag(oldTag._id, this.state.tagsTable,
      this.state.rootTags.slice(), this.state.nameToId);
    var res = handleDeleteNoteTagRefs(oldTag._id, this.state.curNotes.slice(), this.state.pins.slice());
    var newTags = this.state.note.tags.slice();
    const id = newTags.findIndex(el=>el==oldTag._id);
    if(id>-1){
      newTags.splice(id,1);
    }
    this.setState({
      rootTags: newRoots,
      note: Object.assign({}, this.state.note, {tags: newTags}),
      curNotes: res.curNotes,
      pins: res.pins
    });
  }
  //when an alert is minimized
  handleSetShowAlert(bool, message="None"){
    this.setState({searchAlert: {alertMessage: message, showAlert: bool}});
  }
  handlePinClick(event, note){
    event.stopPropagation();
    var newNotes = this.state.curNotes.slice();
    var newPins = this.state.pins.slice();
    const mainNote = this.state.note;
    var newMainNote = mainNote;

    if(!note.isPinned){
      if(note.isActive){
        newMainNote = Object.assign({}, mainNote, {isPinned: 1});
      }
      const newNote = Object.assign({}, note, {isPinned: 1});
      const ind = newNotes.findIndex(el => el._id == note._id);
      newNotes.splice(ind, 1);
      newPins.push(newNote);
    }
    else{
      if(note.isActive){
        newMainNote = newMainNote = Object.assign({}, mainNote, {isPinned: 0});
      }
      const newNote = Object.assign({}, note, {isPinned: 0});
      //FLAg--if unsaved changes in pinned note, popup an alert
      const ind = newPins.findIndex(el => el._id == note._id);
      newPins.splice(ind, 1);
      if(handleCheckAgainstQuery(note.tags.slice(), this.state.curQuery)){
        newNotes.push(newNote);
      }
    }
    this.setState({
      note: newMainNote,
      curNotes: newNotes,
      pins: newPins
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
    handleRefreshIndices(tagsTable, this.state.rootTags);
    this.setState({tagsTable: tagsTable});
  }
  //when the save button is clicked
  async handleSaveClick(event){
    //if first save...
    if(this.state.note._id==null){
      this.pushNoteToDB();
      return;
    }
    var curNotes = this.state.curNotes.slice();
    var pins = this.state.pins.slice();
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
        this.setState({curNotes: curNotes});
      }
      //if it is, update it
      else if(qInd>-1){
        curNotes[qInd] = this.state.note;
        this.setState({curNotes: curNotes});
      }
      else{
        pins[pInd] = this.state.note;
        this.setState({pins: pins});
      }
    }
    //if it should NOT be in curNotes
    else{
      //but it is
      if(qInd > -1){
        curNotes.splice(ind, 1);
        this.setState({curNotes: curNotes});
      }
      //if it isnt, do nothing
    }
    handleUpdateNote(this.state.note);

    this.setState({note: Object.assign({}, this.state.note, {unsavedChanges: 0}) });
  }
  //when the new note button is clicked
  handleNewNoteClick(event){
    handleResetMatches(this.state.tagsTable, this.state.nameToId, this.state.note.tags, this.state.note.wRecs);
    console.log(this.state.initialValue);
    var newNote = {
      _id: null,
      content: this.state.initialValue,
      tags: [],
      wRecs: [],
      unsavedChanges: 0
    };
    var pins = this.state.pins.slice();
    var curNotes = this.state.curNotes.slice();
    if(this.state.note._id!=null){
      if(this.state.note.isPinned){
        const pInd = pins.findIndex(el =>el._id==this.state.note._id);
        pins[pInd] = Object.assign({}, pins[pInd], {isActive:0});
      }
      else{
        const qInd = curNotes.findIndex(el =>el._id==this.state.note._id);
        curNotes[qInd] = Object.assign({}, curNotes[qInd], {isActive:0});
      }
    }
    this.setState({note: newNote, pins: pins, curNotes:curNotes});
  }
  //when the publish botton is clicked (analyzes and pushes a note to DB)
  async handlePublishClick(event){
    if(this.state.note._id==null){
      this.analyzeNote()
      .then((tags => this.pushNoteToDB(tags)));
    }
    else{
      this.analyzeNote().then(wRecs => {
        var pins = this.state.pins.slice();
        const ind = pins.findIndex(el => el._id==this.state.note._id);
        var newNote = Object.assign({},this.state.note,{wRecs: wRecs, unsavedChanges:1});
        if(ind>-1){
          pins[ind] = newNote;
        }
        this.setState({
          note: newNote,
          pins: pins
        });
      })
    }
  }
  //helper functions for handlePublishClick
  //pushes note content to watson, requests wRecs
  async analyzeNote(){
    return handleAnalyzeNote(this.state.note.content)
    .then(response => response.json())
    .then(jso => jso.result)
    .then(result => {
      var entities = result.entities;
      var concepts = result.concepts;
      var keywords = result.keywords;
      return parseWatsonRecs(concepts, entities, keywords);
    });
  }
  //pushes note and new wRecs to mongodb
  async pushNoteToDB(tags = []){
    let wRecs = await tags;
    var newNote = Object.assign({}, this.state.note,
      {wRecs: wRecs, unsavedChanges:0});

    handleInsertNote(newNote)
    .then(res => res.json())
    .then(_id => {
      newNote = Object.assign({}, newNote, {_id: _id, isActive: true});
      var cNotes = this.state.curNotes.slice();
      //checks current note against current query
      if(handleCheckAgainstQuery(newNote.tags, this.state.curQuery)){
        cNotes.push(newNote);
      }
      this.setState({
        note: newNote,
        curNotes: cNotes
      });
    })
  }
  //when a new note is clicked/selected from note-select
  handleNoteSelectClick(event, note){
    if(note.isActive){
      return;
    }
    //reset current match flags in wRecs & extant tags
    handleResetMatches(this.state.tagsTable, this.state.nameToId, this.state.note.tags, this.state.note.wRecs);
    var curNotes = this.state.curNotes.slice();
    var pins = this.state.pins.slice();
    if(this.state.note.isPinned){
      var index = pins.findIndex(el => el._id==this.state.note._id);
      var updatedNote = Object.assign({}, pins[index], {isActive:0});
      pins[index] = updatedNote;
    }
    else if(this.state.note._id!=null && curNotes.findIndex(el => el._id==this.state.note._id)!=-1){
      var index = curNotes.findIndex(el => el._id==this.state.note._id);
      var updatedNote = Object.assign({}, curNotes[index], {isActive:0, isPinned:0});
      curNotes[index] = updatedNote;
    }
    var newNote = Object.assign({}, note, {unsavedChanges:0, isActive:1});
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
      curNotes: curNotes,
      pins: pins
    });
  }
  //when a tag button in the tag bar is clicked
  handleTagBarClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    const curNoteI = this.state.note.content;
    tags.splice(tags.findIndex(cV => {
      return (cV == tag._id);
    }), 1);
    tagsTable[tag._id].noteTagMatch = 0;
    this.setState({
      note: Object.assign({}, this.state.note, {tags: tags, unsavedChanges: 1}),
      tagsTable: tagsTable
    });
  }
  //when an extant tag button is clicked in tag-panel
  handleETagClick(event, tag){
    var tags = this.state.note.tags.slice();
    var tagsTable = this.state.tagsTable;
    var nameToId = this.state.nameToId;
    var curNoteTags = this.state.note.tags;
    if(curNoteTags.findIndex(el => el == tag._id) > -1){
      tags.splice(tags.findIndex(cV => cV == tag._id), 1);
      tagsTable[tag._id].noteTagMatch=0;
    }
    else{
      tags.push(tag._id);
    }
    this.setState({
      note: Object.assign({}, this.state.note, {tags: tags, unsavedChanges: 1})
    });
  }
  //when a watson tag button is clicked in tag-panel
  async handleWTagClick(event, tag){
    var name = tag.name;
    var newT = {
      _id: null,
      name: name,
      children: [],
      parent: null
    }
    var tagsTable = this.state.tagsTable;
    var nameToId = this.state.nameToId;
    var curRoots = this.state.rootTags;
    var curNoteT = this.state.note.tags;
    //check if newT already exists in tags
    const key = caseInsensitiveSearch(name, nameToId);
    if(typeof key !== 'undefined'){
      newT._id=nameToId[key];
      newT.name = key;
      curNoteT.push(newT._id);
      //remove the suggestion from the proper array
      //FLAG -- no longer deleting these
      //const wRes = handleWRecDelete(id, this.state.wRecs.slice());
      this.setState({
        note: Object.assign({}, this.state.note, {tags:curNoteT, unsavedChanges: 1}),
        rootTags: curRoots,
        nameToId: nameToId,
        tagsTable: tagsTable
      });
    }
    else{
      handleInsertNewRootTag(newT, tagsTable, curRoots.slice(), nameToId)
      .then(newRoots => {
        var newId = nameToId[name];
        curNoteT.push(newId);
        //remove the suggestion from the proper array
        //FLAG -- no longer deleting these
        //const wRes = handleWRecDelete(id, this.state.wRecs.slice());
        this.setState({
          note: Object.assign({}, this.state.note, {tags:curNoteT, unsavedChanges: 1}),
          rootTags: newRoots,
          nameToId: nameToId,
          tagsTable: tagsTable
        });
      });
    }
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
    var nameToId = this.state.nameToId;
    var rootTags = this.state.rootTags.slice();
    var noteTags = this.state.note.tags.slice();
    var key = caseInsensitiveSearch(input, nameToId);
    if(typeof key === 'undefined'){
        const path = specialCharacterParse(input);
        //if path is only one string, insert as a root tag and add to note tags
        if(path.length==1){
          var newTag = {
            _id: null,
            name: input,
            children: [],
            parent: null
          };
          return handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId)
          .then(newRoots => {
            const nId = nameToId[input];
            noteTags.push(nId);
            this.setState({
              tagInput: "",
              note: Object.assign({}, this.state.note, {tags: noteTags, unsavedChanges: 1}),
              tagsTable: tagsTable,
              nameToId: nameToId,
              rootTags: newRoots
            });
            return;
          });
        }
        else{
          return this.helperInsertPath(path, rootTags, null)
          .then(res => {
            var newRoots = res.roots;
            var id = res.tagId;
            var flag = (noteTags.findIndex(el => el == id)==-1);
            if(flag){
              noteTags.push(id);
            }
            this.setState({
              tagInput: "",
              note: Object.assign({}, this.state.note, {tags: noteTags, unsavedChanges: (flag?1:this.state.note.unsavedChanges)}),
              tagsTable: tagsTable,
              nameToId: nameToId,
              rootTags: newRoots
            });
            return;
          });
        }
    }
    else{
      if(noteTags.findIndex(el => el == nameToId[key])==-1){
        noteTags.push(nameToId[key]);
        this.setState({tagInput: "",note: Object.assign({}, this.state.note, {tags: noteTags, unsavedChanges: 1})});
      }
      else{
        this.setState({tagInput: ""});
      }
      return;
    }
  }


  //currently very redundant with above--need to refactor mutual logic into helper call
  async handleAddKeyPress(event){
    //escapes this method if the key is not 'Enter'
    if(event.key !== "Enter"){
      return;
    }
    const input = event.target.value.trim();
    var tagsTable = this.state.tagsTable;
    var nameToId = this.state.nameToId;
    var rootTags = this.state.rootTags.slice();
    var key = caseInsensitiveSearch(input, nameToId);
    if(typeof key === 'undefined'){
        const path = specialCharacterParse(input);
        //if path is only one string, insert as a root tag and add to note tags
        if(path.length==1){
          var newTag = {
            _id: null,
            name: input,
            children: [],
            parent: null
          };
          return handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId)
          .then(newRoots => {
            this.setState({
              addInput: "",
              tagsTable: tagsTable,
              nameToId: nameToId,
              rootTags: newRoots
            });
            return;
          });
        }
        else{
          return this.helperInsertPath(path, rootTags, null)
          .then(res => {
            var newRoots = res.roots;
            this.setState({
              addInput: "",
              tagsTable: tagsTable,
              nameToId: nameToId,
              rootTags: newRoots
            });
            return;
          });
        }
    }
    else{
      if(noteTags.findIndex(el => el == nameToId[key])==-1){
        this.setState({addInput: ""});
      }
      else{
        this.setState({addInput: ""});
      }
      return;
    }
  }

  async helperInsertPath(path, rootTags, prev){
    var tagsTable = this.state.tagsTable;
    var nameToId = this.state.nameToId;
    const myKey = caseInsensitiveSearch(path[0], nameToId);
    if(typeof myKey === 'undefined'){
        //if n==0, insert new root tag!
        if( prev == null){
          var newTag = {
            _id: null,
            name: path[0],
            children: [],
            parent: null
          };
          return handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId)
          .then(newRoots => {
            const nId = nameToId[path[0]];
            if(path.length==1){
              return({roots: newRoots, tagId: nId });
            }
            else{
              var newPath = path.slice(1);
              return(this.helperInsertPath(newPath, newRoots, nId));
            }
          });
        }
        //else, insert as a subtag!
        else{
          var newTag = {
            _id: null,
            name: path[0],
            children: [],
            parent: prev
          };
          var promise = Promise.resolve("complete");
          return handleInsertNewSubTag(newTag, prev, tagsTable, rootTags, nameToId, promise)
          .then(_id => {
            if(path.length==1){
              return({roots: rootTags, tagId: _id});
            }
            else{
              var newPath = path.slice(1);
              return(this.helperInsertPath(newPath, rootTags, _id));
            }
          });
        }
    }
    else{
      const nId = nameToId[myKey];
      var newPath = path.slice();
      newPath.splice(0,1);
      if(newPath.length==0){
        return({roots: rootTags, tagId:nId});
      }
      else{
        return(this.helperInsertPath(newPath, rootTags, nId));
      }
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
    var nameToId = this.state.nameToId;
    const type=results.type;
    var promise;
    var newInt;
    var newExt;
    if(type == "command"){
      if(results.command == "all"){
        promise = handleGetAllNotes();
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
      const key = caseInsensitiveSearch(results.tag, nameToId);
      if(typeof key === 'undefined'){
        this.handleSetShowAlert(true, "Tag \""+results.tag+"\" not found");
        return;
      }
      //if the tag has children, add those to a search query
      else if(tagsTable[nameToId[key]].children.length>0){
        const res = handleSearchRecurseChildren(nameToId[key], tagsTable);
        //FLAG -- update the api logic to ensure searching by ID is functional
        promise = handleGetNotesFromTags([res]);
        newExt = key+"/...";
        newInt = {
          type: "tags",
          tags: [res]
        };
      }
      else{
        promise = handleGetNoteFromTag(nameToId[key]);
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
          const key = caseInsensitiveSearch(tagsArray[n][m], nameToId);
          if(typeof key !== 'undefined'){
            //if has children....
            if(tagsTable[nameToId[key]].children.length>0){
              const res = handleSearchRecurseChildren(nameToId[key], tagsTable);
              newTags[n] = newTags[n].concat(res);
              newExt = newExt+key+"/...";
            }
            else{
              newTags[n].push(nameToId[key]);
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
      //FLAG - ensure search logic works with objid
      promise = handleGetNotesFromTags(newTags);
      newInt = {
        type: type,
        tags: newTags
      };
    }
    //update notes
    if(typeof promise === 'undefined'){
      handleResetMatches(this.state.tagsTable, this.state.nameToId, this.state.note.tags, this.state.note.wRecs);
      this.setState({
        curNotes: [],
        curQuery: {
          external: newExt,
          internal: newInt
        }
      });
      return;
    }
    promise.then(res => res.json())
    .then(notes => {
      handleResetMatches(this.state.tagsTable, this.state.nameToId, this.state.note.tags, this.state.note.wRecs);
      this.setState({
        curNotes: notes,
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
      var nameToId = this.state.nameToId;
      const targetTagID = result.combine.draggableId;
      //if came from watson suggestion
      if(result.source.droppableId=="wstags"){
        const tagID = result.draggableId.substr(2);
        const newTag = {
          _id: null,
          name: tagID,
          children: [],
          parent: targetTagID
        };
        var promise = Promise.resolve("complete");
        handleInsertNewSubTag(newTag, targetTagID, tagsTable, rootTags.slice(), nameToId, promise)
        .then(() => {
          //FLAG -- need to review how wRecs are stored
          //const newWRecs = handleWRecDelete(tagID, this.state.wRecs.slice());
          this.setState({
            tagsTable: tagsTable,
            nameToId: nameToId
          });
          return;
        });
      }
      //else it came from extant tags
      else{
        //get draggedTag
        const draggedTagID = result.draggableId;
        //call handleMoveTag
        const newRoots = handleMoveTag(draggedTagID, targetTagID, tagsTable, rootTags.slice());
        this.setState({
          rootTags: newRoots,
          tagsTable: tagsTable,
          nameToId: nameToId
        });
        return;
      }
    }
    else{
      console.log(result);
      if(!result.destination){
        return;
      }
      //add tag as Root tag if attempting to drop anywhere
      if(result.destination.index>=0){
        var tagsTable = this.state.tagsTable;
        var nameToId = this.state.nameToId;
        var rootTags = this.state.rootTags.slice();
        if(result.source.droppableId=="wstags"){
          const tagID = result.draggableId.substr(2);
          var newTag = {
            _id: null,
            name: tagID,
            children: [],
            parent: null
          };
          handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId)
          .then(newRoots => {
            //FLAG -- need to review how wRecs are stored
            //const newWRecs = handleWRecDelete(tagID, this.state.wRecs.slice());
            this.setState({
              rootTags: newRoots,
              tagsTable: tagsTable,
              nameToId: nameToId
            });
            return;
          });
        }
        else{
          if(result.destination.index==result.source.index){
            return;
          }
          var tagsTable = this.state.tagsTable;
          var rootTags = this.state.rootTags.slice();
          var nameToId = this.state.nameToId;
          //unless already a root tag
          if(tagsTable[result.draggableId].parent==null){
            return;
          }
          rootTags = handleMoveTag(result.draggableId, null, tagsTable, rootTags);
          this.setState({
            rootTags: rootTags,
            tagsTable: tagsTable,
            nameToId: nameToId
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
              curNotes = {this.state.curNotes}
              pins = {this.state.pins}
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
                  tagsTable = {this.state.tagsTable}
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
                  nameToId = {this.state.nameToId}
                  rootTags = {this.state.rootTags}
                  noteTags = {this.state.note.tags}
                  onExClick = {this.handleETagClick}
                  addInput = {this.state.addInput}
                  onAddInputChange = {this.handleAddInputChange}
                  onAddKeyPress = {this.handleAddKeyPress}
                  onCollapseClick={this.handleCollapseClick}
                  onModalRename={this.handleModalRename}
                  onModalRenameAdd={this.handleModalRenameAdd}
                  onModalDelete={this.handleModalDelete}
                  onWsClick = {this.handleWTagClick}
                  wRecs = {this.state.note.wRecs}
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
function handleValidateNoteTags(tags, tagsTable){
  var newTags = [];
  for(var tag of tags){
    if(typeof tagsTable[tag] !== 'undefined'){
      newTags.push(tag);
    }
  }
  return newTags;
}
//handles api interface for moving draggedTag to be targetTag's child--returns updated roots
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
function handleRemoveTagRefs(draggedTagID, tagsTable, rootTags, fromDelete=0){
  const draggedTag = tagsTable[draggedTagID];
  console.log("dTag: ",draggedTag);
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
//inserts draggedTag as a child of targetTag when draggedTag IS in tagsTable
function handleReInsertTag(draggedTagID, targetTagID, tagsTable, rootTags){
  tagsTable[draggedTagID].parent = targetTagID;
  if(!tagsTable[draggedTagID].isCollapsed){
    tagsTable[draggedTagID].children = [];
  }
  const newT = tagsTable[draggedTagID];
  handleUpdateTagReq(newT);
  //if reinserting at root
  if(targetTagID==null){
    rootTags.push(draggedTagID);
    return rootTags;
  }
  var children = tagsTable[targetTagID].children.slice();
  children.push(draggedTagID);
  tagsTable[targetTagID].children = children;
  const newParent = tagsTable[targetTagID];
  handleUpdateTagReq(newParent);
  return rootTags;
}
//handles api calls for inserting {newTag} as a child of {targetTag}
//currently only supports inserting a childless tag
async function handleInsertNewSubTag(newTag, targetTagID, tagsTable, rootTags, nameToId, promise){
  //insert the new tag into the database
  //also update the children of the parent tag
  return promise.then(res => {
    return handleInsertTagReq(newTag)
    .then(re => re.json())
    .then(_id => {
      var updTag = Object.assign({}, newTag, {_id: _id});
      insertNewSubTag(updTag, targetTagID, tagsTable, nameToId);
      var target = tagsTable[targetTagID];
      handleUpdateTagReq(target);
      handleRefreshIndices(tagsTable, rootTags);
      return(_id);
    });
  });
}
//inserts {newTag} into tagsTable as a child of {targetTag}
//assuming newTag is not to be a rootTag
function insertNewSubTag(newTag, targetTagID, tagsTable, nameToId){
  tagsTable[newTag._id] = newTag;
  tagsTable.size = tagsTable.size+1;
  nameToId[newTag.name] = newTag._id;
  const targetTag = tagsTable[targetTagID];
  var children = targetTag.children.slice();
  children.push(newTag._id);
  tagsTable[targetTag._id] = Object.assign({},targetTag, {children: children});
  return;
}
//inserts {newTag} as a root into tagsTable, rootTags, and DB, returning updated rootTags
async function handleInsertNewRootTag(newTag, tagsTable, rootTags, nameToId){
  return handleInsertTagReq(newTag)
  .then(res => res.json())
  .then(_id => {
    newTag._id = _id;
    tagsTable[_id] = newTag;
    tagsTable.size = tagsTable.size+1;
    nameToId[newTag.name] = _id;
    rootTags.push(_id);
    handleRefreshIndices(tagsTable, rootTags);
    return rootTags;
  });
}
//handles the renaming of a tag (deleting the old tag, replacing references
//to that tag with references to new id, updating tagsTable)
//FLAG --is this code enough?
function handleRenameTag(oldId, newName, tagsTable, rootTags, nameToId){
  var tagData = tagsTable[oldId];
  var newTag = Object.assign({}, tagData, {name: newName});
  delete nameToId[tagData.name];
  nameToId[newName] = oldId;
  tagsTable[oldId] = newTag;
  var promise = handleUpdateTagReq(newTag);
  return promise;
}
//handles the deleting of tagId from tagsTable, the DB, and other tag references
function handleDeleteTag(tagId, tagsTable, rootTags, nameToId){
  handleDeleteTagReq(tagId);
  rootTags = handleRemoveTagRefs(tagId, tagsTable, rootTags.slice(), 1);
  delete nameToId[tagsTable[tagId].name];
  delete tagsTable[tagId];
  tagsTable.size=tagsTable.size-1;
  handleRefreshIndices(tagsTable, rootTags);
  return rootTags;
}
function handleDeleteNoteTagRefs(tagId, curNotes, pins){
  handleDeleteNoteTagReq(tagId);
  for(var n=0; n<curNotes.length; n++){
    const id = curNotes[n].tags.findIndex(el => el == tagId);
    if(id > -1){
      var newTags = curNotes[n].tags.slice();
      newTags.splice(id,1);
      curNotes[n] = Object.assign({}, curNotes[n], {tags: newTags});
    }
  }
  for(var m=0; m<pins.length; m++){
    const pid = pins[m].tags.findIndex(el => el == tagId);
    if(pid > -1){
      var newTags = pins[m].tags.slice();
      newTags.splice(pid,1);
      pins[m] = Object.assign({}, pins[m], {tags: newTags});
    }
  }
  return({curNotes: curNotes, pins: pins});

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
//FLAG -- ensure wRecs._id is a name...
function handleResetMatches(tagsTable, nameToId, curNotes, wRecs){
  for(var n=0; n<curNotes.length; n++){
    tagsTable[curNotes[n]].noteTagMatch = 0;
  }
  for(var m=0; m<wRecs.length; m++){
    const key = caseInsensitiveSearch(wRecs[m]._id, nameToId);
    if(typeof key !== 'undefined'){
      tagsTable[nameToId[key]].wTagMatch = 0;
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
      //FLAG -- add an "isignored" attribute?
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
  if(type=="command"){
    if(curQuery.internal.command == "all"){
      return true;
    }
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
function handleSearchRecurseChildren(id, tagsTable){
  var res = [id];
  const children = tagsTable[id].children.slice();
  for(var n=0; n<children.length; n++){
    res = res.concat(handleSearchRecurseChildren(children[n], tagsTable));
  }
  return res;
}
//LOWEST LEVEL API HANDLER FUNCTIONS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//handles request for getting all tags from DB
//sortType -- optional sort mode (defaults to sorting by name)
//returns a promise--whose value is the user's entire tag DB
async function handleGetAllTags(sortType) {
  return fetch('/api/mongo-gettags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sortType)
  });
}
async function handleGetAllNotes(sortType) {
  return fetch('/api/mongo-getallnotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
async function handleGetNoteFromTag(tag){
  return fetch('http://localhost:3000/api/mongo-getnotefromtag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({tag: tag})
  });
}
async function handleGetNotesFromTags(tags){
  return fetch('http://localhost:3000/api/mongo-getnotefromtags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({tags: tags})
  });
}
async function handleUpdateNote(noteData) {
  return fetch('http://localhost:3000/api/mongo-updatenote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(noteData)
  });
}
async function handleAnalyzeNote(content) {
  return fetch('http://localhost:3000/api/watson-analyzenote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: content,
    })
  });
}
async function handleInsertNote(newNote){
  return fetch('http://localhost:3000/api/mongo-insertnote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newNote)
  });
}
//simply handles the api req for inserting a tags
async function handleInsertTagReq(newTag){
  return fetch('http://localhost:3000/api/mongo-inserttag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTag)
  });
}
//updates db tags with parent=prevP to new parent
async function handleUpdateParentsReq(prevP, newP){
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
async function handleUpdateTagReq(newTag){
  return fetch('http://localhost:3000/api/mongo-updatetag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTag)
  });
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
async function handleDeleteNoteTagReq(tagId){
  return fetch('http://localhost:3000/api/mongo-deletenotetags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({_id: tagId})
  });
}

export default MainController;
