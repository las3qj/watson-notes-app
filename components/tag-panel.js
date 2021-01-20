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
  const handleClose = () => setShow(-1);
  const [onSave, setOnSave] = useState(() => handleClose);
  const [header, setHeader] = useState("null");
  const [body, setBody] = useState("null");
  const [buttonText, setButtonText] = useState("null");
  const [input, setInput] = useState("Button name");
  const handleInputChange = (text) => setInput(text);
  const handleShow = (item) => {
    if(item == "Rename"){
      setShow(0);
      setHeader("Rename");
      setButtonText("Save");
      setOnSave((old, newT) => props.handleModalRename(old, newT));
      setBody(<input value={input} onChange={(e)=>handleInputChange(e.target.value)}/>);
    }
  }
  var wRecs = parseTags(props.wRecs.slice(), props.noteTags.slice(), props.tagsTable);
  return(
    <div className={styles.tagpanel}>
      {(show>-1) && <Modal show={(show>-1)} onHide={handleClose} size="sm" centered>
        <Modal.Header closeButton>
          <Modal.Title>{header}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant={"primary-"+props.currentTheme} onClick={onSave}>
            {buttonText}
          </Button>
        </Modal.Footer>
      </Modal>}
      <DragDropContext onDragEnd={props.onDragEnd}>
        <ExtantTags
          rootTags={props.rootTags}
          tagsTable={props.tagsTable}
          noteTags={props.noteTags}
          onClick={props.onExClick}
          sendAheadInput={handleInputChange}
          onDropDownSelect={handleShow}
          onCollapseClick={props.onCollapseClick}
          currentTheme={props.currentTheme}
        />
        <WatsonTags
          size = {Object.keys(props.tagsTable).length}
          onClick = {props.onWsClick}
          wRecs = {wRecs}
          currentTheme={props.currentTheme}
        />
      </DragDropContext>
    </div>
  );
}

//REVIEW -- is too much to do while rendering??
function parseTags(wRecs, noteTags, tagsTable){
  wRecs = parseNoteTags();
  wRecs = parseWRecs();
  return wRecs;

  //assumes noteTgs is an array of STRINGS referring to tags
  //returns wRecs purged of matches with a tag in notetags
  function parseNoteTags(){
    var res = wRecs.slice();
    for(var p=0; p<noteTags.length; p++){
      //first match with tagsTable
      tagsTable[noteTags[p]].noteTagMatch = 1;
      //then with wRecs
      const index = res.findIndex(el => el._id.toLowerCase() == noteTags[p].toLowerCase());
      if(index > -1){
        res.splice(index, 1);
      }
    }
    return res;
  }
  function parseWRecs(){
    var res = wRecs.slice();
    for(var n=0; n<wRecs.length; n++){
      const key = caseInsensitiveSearch(wRecs[n]._id, tagsTable);
      if(typeof key !== 'undefined'){
        res[n].eTagMatch = 1;
        tagsTable[key].wTagMatch = 1;
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
        noteTags={props.noteTags}
        onClick={props.onClick}
        sendAheadInput={props.sendAheadInput}
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
    const dropDownItems = ["Rename and add", "Delete", "Hide"];
    return (
      <Draggable key = {""+index} draggableId={"wS"+dTag._id} index={index}>
        {(provided) => (
          <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            <TagSplitButton
              variant= {dTag.eTagMatch ? "info" : "primary"}
              onClick={props.onClick}
              tag={dTag._id}
              badge={dTag.eTagMatch ? "!" : "false"}
              dropDownItems={dropDownItems}
              currentTheme={props.currentTheme}
            />
          </li>
        )}
      </Draggable>
    );
  }
  return(
    <div className={styles.wstags}>
      <h4>
        <Badge variant = "light"> Suggested tags </Badge>
      </h4>
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
          sendAheadInput={props.sendAheadInput}
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
  const dropDownItems = ["Rename", "Delete", "Focus", "Hide"];
  return(
    <Draggable key = {""+props.tag.index} draggableId={props.tag._id} index={props.tag.index}>
      {(provided) => (
        <li className="customicon" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <span className="icon" onClick={(e) => props.onCollapseClick(e, props.tag._id)}> {props.icon} </span>
          <TagSplitButton
            badge = {props.badge} onClick={props.onClick} dropDownItems={dropDownItems}
            tag={props.tag._id} variant={props.variant} currentTheme={props.currentTheme}
            onDropDownSelect={props.onDropDownSelect} sendAheadInput={props.sendAheadInput}
          />
        </li>
      )}
    </Draggable>
  );
}

function TagSplitButton(props){
  var title;
  if(props.badge=="false"){
    title = props.tag;
  }
  else{
    var badge = <Badge variant="light"> {props.badge} </Badge>;
    //REVIEW: MAKE THIS A DIV?
    title = React.createElement('span', null, [(props.tag+" "), badge]);
  }
  return(
    <SplitButton
      variant={props.variant+"-"+props.currentTheme}
      onClick={(e)=>props.onClick(e, props.tag)}
      onMouseOver={props.sendAheadInput!=null? ((e)=>props.sendAheadInput(props.tag)) : null}
      size="sm"
      title={title}
    >
      {props.dropDownItems.map((item, index) => {
        return (<Dropdown.Item eventKey={index}
          onSelect={(key,event) => {
            props.onDropDownSelect(item);
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
    > {props.tag} </Button>
  )
}

export {TagSplitButton, TagButton};
