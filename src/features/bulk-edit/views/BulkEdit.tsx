import {
  Button,
  CheckboxField,
  FieldGroup,
  Heading,
  Paragraph,
  Typography,
} from "@contentful/forma-36-react-components";
import React from "react";
import { Operation } from "../entries-operations/schemas";

interface BulkEditProps {
  operations: Operation[];
  dryRun: boolean;
  setDryRun: React.Dispatch<React.SetStateAction<boolean>>;
  onBulkEdit: () => void;
}

const BulkEdit: React.FC<BulkEditProps> = (props) => {
  const { operations, dryRun, setDryRun, onBulkEdit } = props;

  return (
    <section className="mt-12">
      <Typography>
        <Heading>3. Run bulk editing</Heading>
      </Typography>
      {operations.length === 0 ? (
        <Typography>
          <Paragraph className="text-lg">
            After you add some operations, you will be able to run the bulk
            editing
          </Paragraph>
        </Typography>
      ) : (
        <div>
          <FieldGroup className="mb-4">
            <CheckboxField
              labelText="Dry run"
              value="yes"
              helpText="Check this field if you want to test your bulk editing configuration without affecting the entries"
              id="dryRun"
              checked={dryRun === true}
              onChange={(e) => {
                setDryRun((e.target as HTMLInputElement).checked);
              }}
            />
          </FieldGroup>
          <Button
            onClick={() => {
              onBulkEdit();
            }}
          >
            {dryRun === true ? "Run as dry run" : "Run bulk editing"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default BulkEdit;
