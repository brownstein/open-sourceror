import { useState } from "react";
import { connect } from "react-redux";

import { closeModal } from "src/redux/actions/ui";
import { loadScriptFromItem } from "src/redux/actions/scripts";
import useKey from "src/components/hooks/use-key";
import ItemGrid from "src/components/items/item-grid";
import BaseModal from "../base";

import "src/less/forms.less";
import "./load-script.less";

function LoadScriptModal({
  onSelectItem
}) {
  return (
    <BaseModal>
      <div>
        <ItemGrid
          onClickItem={onSelectItem}
          enableItemTypes={["Scroll"]}
          />
      </div>
    </BaseModal>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    onSelectItem: item => {
      dispatch(closeModal());
      dispatch(loadScriptFromItem(item));
    }
  };
}

export default connect(null, mapDispatchToProps)(LoadScriptModal);
