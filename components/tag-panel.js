import React, {useState} from 'react';
import styles from '../styles/CreateNewPage.module.css';
import { caseInsensitiveSearch } from '../util/string-parsing.js';
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd';
import SplitButton from 'react-bootstrap/SplitButton';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Image from 'react-bootstrap/Image';
import Modal from 'react-bootstrap/Modal';

//Expected props: rootsTags, tagsTable, noteTags
export default function TagPanel(props){
  //modal code/state
  const [show, setShow] = useState(-1);
  const [header, setHeader] = useState("");
  const [tag, setTag] = useState(null);
  const [input, setInput] = useState("");
  const handleClose = () => setShow(-1);
  var modal;
  const handleShow = (item, tag) => {
    if(item == "Rename"){
      setShow(1);
      setHeader("Rename");
      setTag(props.tagsTable[tag._id]);
      setInput(props.tagsTable[tag._id].name);
    }
    else if(item == "Delete"){
      setShow(2);
      setHeader("Delete");
      setTag(props.tagsTable[tag._id]);
      setInput(props.tagsTable[tag._id].name);
    }
    else if(item == "Rename and add"){
      setShow(3);
      setHeader("Rename and add");
      setTag(tag);
      setInput(tag.name);
    }
  }
  var wRecs = parseTags(props.wRecs.slice(), props.noteTags.slice(), props.tagsTable, props.nameToId);
  return(
    <div className={styles.tagpanel}>
      {(show>-1) ? <TagModal header={header} tag={tag} show={show}
          handleClose={handleClose} currentTheme={props.currentTheme}
          handleSave={(show==1) ? props.onModalRename : (show==2?props.onModalDelete:props.onModalRenameAdd)}
          />: null}
      <DragDropContext onDragEnd={props.onDragEnd}>
        <ExtantTags
          rootTags={props.rootTags}
          tagsTable={props.tagsTable}
          nameToId={props.nameToId}
          noteTags={props.noteTags}
          onClick={props.onExClick}
          onDropDownSelect={handleShow}
          onCollapseClick={props.onCollapseClick}
          currentTheme={props.currentTheme}
        />
        <WatsonTags
          size = {props.tagsTable.size}
          onClick = {props.onWsClick}
          wRecs = {wRecs}
          onDropDownSelect = {handleShow}
          currentTheme={props.currentTheme}
        />
      </DragDropContext>
    </div>
  );
}
class TagModal extends React.Component{
  constructor(props){
    super(props);
    this.handleInputChange=this.handleInputChange.bind(this);
    this.state={
      show: props.show,
      header: props.header,
      tag: props.tag,
      input: props.tag.name,
      handleSave: props.handleSave,
      handleClose: props.handleClose,
      currentTheme: props.currentTheme
    };
  }
  handleInputChange(event){
     this.setState({input: event.target.value});
  }

  render(){
    return(
      <Modal show={1} onHide={this.state.handleClose} size="sm" centered>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.header}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        {(this.state.show==1 || this.state.show==3) ?
          <input value={this.state.input} onKeyPress={(e)=>{
            if(e.key!=="Enter"){return;}
            this.state.handleSave(this.state.tag, this.state.input);
            this.state.handleClose();}}
            onChange={(e)=>this.handleInputChange(e)}
          />
          : <span> Delete {this.state.input} ? </span>
        }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.state.handleClose}>
            Close
          </Button>
          <Button variant={"primary-"+this.state.currentTheme} onClick={()=>{
            this.state.handleSave(this.state.tag, this.state.input);
            this.state.handleClose();
          }}>
            {this.state.show==2?"Delete":(this.state.show==1?"Save":"Add")}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

//FLAG -- is too much to do while rendering??
function parseTags(wRecs, noteTags, tagsTable, nameToId){
  wRecs = parseNoteTags();
  wRecs = parseWRecs();
  return wRecs;

  //assumes noteTgs is an array of ID's referring to tags
  //returns wRecs purged of matches with a tag in notetags
  function parseNoteTags(){
    var res = wRecs.slice();
    for(var p=0; p<noteTags.length; p++){
      //first match with tagsTable
      tagsTable[noteTags[p]].noteTagMatch = 1;
      //then with wRecs
      const index = res.findIndex(el => el._id.toLowerCase() == tagsTable[noteTags[p]].name.toLowerCase());
      if(index > -1){
        res.splice(index, 1);
      }
    }
    return res;
  }
  function parseWRecs(){
    var res = wRecs.slice();
    for(var n=0; n<wRecs.length; n++){
      const key = caseInsensitiveSearch(wRecs[n]._id, nameToId);
      if(typeof key !== 'undefined'){
        res[n].eTagMatch = 1;
        tagsTable[nameToId[key]].wTagMatch = 1;
      }
    }
    return res;
  }
}

function ExtantTags(props){
  return(
    <div className={styles.extags}>
      <h4>
        <Badge variant = "light"> My tags </Badge>
      </h4>
      <TagTree
        rootTags={props.rootTags}
        tagsTable={props.tagsTable}
        nameToId={props.nameToId}
        noteTags={props.noteTags}
        onClick={props.onClick}
        onDropDownSelect={props.onDropDownSelect}
        onCollapseClick={props.onCollapseClick}
        currentTheme={props.currentTheme}
      />
    </div>
  );
}

//props: wRecs, size
function WatsonTags(props){
  function tagsToButton(dTag, index){
    const dropDownItems = ["Rename and add", "Delete"];
    return (
      <Draggable key = {""+index} draggableId={"wS"+dTag._id} index={index}>
        {(provided) => (
          <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            <TagSplitButton
              variant= {dTag.eTagMatch ? "info" : "primary"}
              onClick={props.onClick}
              tag={{name: dTag._id}}
              badge={dTag.eTagMatch ? "!" : "false"}
              dropDownItems={dropDownItems}
              onDropDownSelect={props.onDropDownSelect}
              currentTheme={props.currentTheme}
            />
          </li>
        )}
      </Draggable>
    );
  }
  return(
    <div className={styles.wstags}>
      <Badge variant = "light"> Suggested tags </Badge>
      <Droppable droppableId="wstags" isDropDisabled={true}>
        {(provided) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {props.wRecs.map((el, index) => tagsToButton(el, (props.size + index)))}
          </ul>
        )}
      </Droppable>
    </div>
  )
}

function TagTree(props){
  const rootTags = props.rootTags.slice();
  const noteTags = props.noteTags.slice();
  var tagsTable = props.tagsTable;
  var results = [];

  for(var n=0; n<rootTags.length; n++){
    const root = rootTags[n];
    const res = helperTreeRecurse(root);
    results.push(res); //the draggable list item
  }
  //REVIEW: combining is currently off
  return (
    <div>
      <Droppable droppableId="extantTree" isCombineEnabled={true}>
        {(provided) => (
          <ul className="treelist" {...provided.droppableProps} ref={provided.innerRef}>
            {results}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </div>
  );

  function helperTreeRecurse(tag){
    const myTag = tagsTable[tag];
    var myResults = [];
    //loop through children to add to results
    if(!myTag.isCollapsed){
      for(var n=0; n<myTag.children.length; n++){
        const res = helperTreeRecurse(myTag.children[n]);
        myResults.push(res);
      }
    }
    const data = tagsTable[tag];
    var variant;
    var badge = "false";
    if(data.noteTagMatch){
      variant = "success";
    }
    else if(data.wTagMatch){
      variant = "info";
      badge = "!";
    }
    else {
      variant = "primary";
    }

    return(
      <div>
        <TagTreeNode
          tag={data}
          currentTheme={props.currentTheme}
          badge={badge}
          variant={variant}
          onClick={props.onClick}
          onDropDownSelect={props.onDropDownSelect}
          onCollapseClick={props.onCollapseClick}
          icon={myTag.children.length ? (data.isCollapsed ? <Image src="/arrow-right.png" rounded/> : <Image src="/arrow-down.png" rounded/>) : "•"}
        />
        <ul className="treelist">
          {myResults}
        </ul>
      </div>
    );
  }
}

function TagTreeNode(props){
  const dropDownItems = ["Rename", "Delete"];
  return(
    <Draggable key = {""+props.tag.index} draggableId={props.tag._id} index={props.tag.index}>
      {(provided) => (
        <li className="customicon" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <span className="icon" onClick={(e) => props.onCollapseClick(e, props.tag._id)}> {props.icon} </span>
          <TagSplitButton
            badge = {props.badge} onClick={props.onClick} dropDownItems={dropDownItems}
            tag={props.tag} variant={props.variant} currentTheme={props.currentTheme}
            onDropDownSelect={props.onDropDownSelect}
          />
        </li>
      )}
    </Draggable>
  );
}

function TagSplitButton(props){
  var title;
  if(props.badge=="false"){
    title = props.tag.name;
  }
  else{
    var badge = <Badge variant="light"> {props.badge} </Badge>;
    //REVIEW: MAKE THIS A DIV?
    title = React.createElement('span', null, [(props.tag.name+" "), badge]);
  }
  return(
    <SplitButton
      variant={props.variant+"-"+props.currentTheme}
      onClick={(e)=>props.onClick(e, props.tag)}
      size="sm"
      title={title}
    >
      {props.dropDownItems.map((item, index) => {
        return (<Dropdown.Item eventKey={index}
          onSelect={(key,event) => {
            props.onDropDownSelect(item, props.tag);
          }} > {item} </Dropdown.Item>);
      })}
    </SplitButton>
  );
}

function TagButton(props){
  return(
    <Button
      onClick={(e)=>props.onClick(e, props.tag)}
      variant={props.variant+"-"+props.currentTheme}
      size="sm"
      className={styles.tagbutton}
    > {props.tag.name} </Button>
  )
}

export {TagSplitButton, TagButton};
