import React from 'react';
import styles from '../styles/CreateNewPage.module.css';
import { caseInsensitiveSearch } from '../util/string-parsing.js';
import { DragDropContext, Droppable, Draggable, resetServerContext } from 'react-beautiful-dnd';
import SplitButton from 'react-bootstrap/SplitButton';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';

//Expected props: rootsTags, tagsTable, noteTags
export default function TagPanel(props){
  var wRecs = parseTags(props.wRecs.slice(), props.noteTags.slice(), props.tagsTable);
  return(
    <DragDropContext onDragEnd={props.onDragEnd} className={styles.tagpanel}>
      <ExtantTags
        rootTags={props.rootTags}
        tagsTable={props.tagsTable}
        noteTags={props.noteTags}
        onClick={props.onExClick}
      />
      <WatsonTags
        size = {Object.keys(props.tagsTable).length}
        onClick = {props.onWsClick}
        wRecs = {wRecs}
      />
    </DragDropContext>
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
          <ul {...provided.droppableProps} ref={provided.innerRef}>
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
    for(var n=0; n<myTag.children.length; n++){
      const res = helperTreeRecurse(myTag.children[n]);
      myResults.push(res);
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
          badge={badge}
          variant={variant}
          onClick={props.onClick}
        />
        <ul>
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
        <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <TagSplitButton
            badge = {props.badge} onClick={props.onClick} dropDownItems={dropDownItems}
            tag={props.tag._id} variant={props.variant}
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
    title = React.createElement('span', null, [(props.tag+" "), badge]);
  }
  return(
    <SplitButton
      variant={props.variant}
      onClick={(e)=>props.onClick(e, props.tag)}
      size="sm"
      title={title}
    >
      {props.dropDownItems.map((item, index) => {
        return (<Dropdown.Item eventKey={index}> {item} </Dropdown.Item>);
      })}
    </SplitButton>
  );
}

function TagButton(props){
  return(
    <Button
      onClick={(e)=>props.onClick(e, props.tag)}
      variant={props.variant}
      size="sm"
      className={styles.tagbutton}
    > {props.tag} </Button>
  )
}

export {TagSplitButton, TagButton};
